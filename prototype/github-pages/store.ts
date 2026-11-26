import { z } from 'zod';
import { defaultProfile, lotFromDraft, profileInput } from '../lib/collector-input';
import { result, withStore } from '../lib/device-db';
import { DomainError, mutateLot, type Lot, type Profile } from '../lib/domain';
import { mediaType, maxMediaBytes, checkSignature } from '../lib/media-format';

export async function localRequest(scope: string, input?: unknown) {
  if (input === undefined) {
    return withStore('readonly', scope, async (store, key) => {
      const prefix = key('lot:');
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
      const lots: Lot[] = await result(store.getAll(range));
      const profile: Profile = await result(store.get(key('profile'))) ?? defaultProfile;
      lots.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return { scope, profile, lots: lots.slice(0, 500), samplePrices: true };
    });
  }
  const action = z.record(z.string(), z.unknown()).parse(input);
  return withStore('readwrite', scope, async (store, key) => {
    if (action.action === 'profile') {
      const profile = profileInput.parse(action.profile);
      store.put(profile, key('profile'));
      return { profile };
    }
    if (action.action === 'create_lot') {
      const lot = lotFromDraft(action.lot);
      const name = key('lot:' + lot.id);
      const existing: Lot | undefined = await result(store.get(name));
      if (existing) return { lot: existing };
      for (const [id, type] of [[lot.photoId, 'image/'], [lot.audioId, 'audio/']] as const) {
        if (id) {
          const metadata: { mime: string } | undefined = await result(store.get(key('attachment:' + id)));
          if (!metadata?.mime.startsWith(type)) throw new DomainError('Save the matching attachment first.');
        }
      }
      store.put(lot, name);
      return { lot };
    }
    const id = z.string().uuid().parse(action.id);
    const name = key('lot:' + id);
    const current: Lot | undefined = await result(store.get(name));
    if (!current) throw new DomainError('Lot not found', 404);
    const lot = mutateLot(current, action);
    if (lot.version !== current.version) store.put(lot, name);
    return { lot };
  });
}

export async function saveMedia(scope: string, id: string, blob: Blob) {
  z.string().uuid().parse(id);
  if (blob.size > maxMediaBytes) throw new DomainError('Keep attachments below 2 MB', 413);
  const mime = mediaType(blob.type);
  const bytes = await blob.arrayBuffer();
  checkSignature(mime, new Uint8Array(bytes));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hash = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  await withStore('readwrite', scope, async (store, key) => {
    const name = key('attachment:' + id);
    const existing: { mime: string; hash: string } | undefined = await result(store.get(name));
    if (existing) {
      if (existing.hash !== hash || existing.mime !== mime) throw new DomainError('Attachment reference already used', 409);
      return;
    }
    store.put({ mime, hash }, name);
    store.put(blob, key('media:' + scope + ':' + id));
  });
}
