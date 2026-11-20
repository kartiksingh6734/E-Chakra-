import { z } from 'zod';
import { database, bucket, ownerOf, sameOrigin, checkScope, fail } from '@/lib/server';
import { DomainError } from '@/lib/domain';
import { readBoundedBody } from '@/lib/request-body';

export const dynamic = 'force-dynamic';
const maxBytes = 2_000_000;
const privateHeaders = { 'Cache-Control': 'private, no-store' };
const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': bytes => startsWith(bytes, [0xff, 0xd8, 0xff]),
  'image/png': bytes => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': bytes => tag(bytes, 0) === 'RIFF' && tag(bytes, 8) === 'WEBP',
  'audio/webm': bytes => startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]),
  'audio/mp4': bytes => tag(bytes, 4) === 'ftyp',
  'audio/ogg': bytes => tag(bytes, 0) === 'OggS',
};

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function tag(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

function attachmentId(request: Request) {
  const result = z.string().uuid().safeParse(new URL(request.url).searchParams.get('id'));
  if (!result.success) throw new DomainError('Invalid attachment reference');
  return result.data;
}

type MediaRow = { owner: string; mime: string; object_key: string };
function findMedia(id: string) {
  return database().prepare('SELECT owner, mime, object_key FROM media WHERE id=?')
    .bind(id).first<MediaRow>();
}

async function confirmRetry(row: MediaRow, owner: string, mime: string, bytes: Uint8Array) {
  const conflict = () => new DomainError('Attachment reference already used', 409);
  if (row.owner !== owner || row.mime !== mime) throw conflict();
  const object = await bucket().get(row.object_key);
  if (!object) throw new DomainError('Attachment storage is unavailable', 503);
  const stored = new Uint8Array(await object.arrayBuffer());
  if (stored.length !== bytes.length || !stored.every((byte, index) => byte === bytes[index])) {
    throw conflict();
  }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const owner = ownerOf(request);
    await checkScope(request, owner);
    const id = attachmentId(request);
    const mime = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!Object.hasOwn(signatures, mime)) throw new DomainError('Unsupported file type');
    const bytes = await readBoundedBody(request, maxBytes);
    if (!signatures[mime](bytes)) throw new DomainError('File contents do not match the attachment type');

    const reply = () => Response.json({ id }, { headers: privateHeaders });
    const existing = await findMedia(id);
    if (existing) {
      await confirmRetry(existing, owner, mime, bytes);
      return reply();
    }

    const key = crypto.randomUUID();
    const storage = bucket();
    await storage.put(key, bytes, { httpMetadata: { contentType: mime } });
    let changed: number;
    try {
      const result = await database().prepare(
        'INSERT INTO media(id,owner,mime,object_key,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING'
      ).bind(id, owner, mime, key, new Date().toISOString()).run();
      changed = result.meta.changes;
    } catch (error) {
      // A timed-out insert may have committed. Keep any object referenced in D1.
      const current = await findMedia(id);
      if (current?.object_key !== key) await storage.delete(key);
      throw error;
    }
    if (!changed) {
      await storage.delete(key);
      const current = await findMedia(id);
      if (!current) throw new DomainError('Attachment storage is unavailable', 503);
      await confirmRetry(current, owner, mime, bytes);
    }
    return reply();
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: Request) {
  try {
    const owner = ownerOf(request);
    await checkScope(request, owner);
    const id = attachmentId(request);
    const row = await database().prepare('SELECT object_key,mime FROM media WHERE id=? AND owner=?')
      .bind(id, owner).first<Pick<MediaRow, 'object_key' | 'mime'>>();
    if (!row) throw new DomainError('Attachment not found', 404);
    const object = await bucket().get(row.object_key);
    if (!object) throw new DomainError('Attachment unavailable', 404);
    return new Response(object.body, {
      headers: { ...privateHeaders, 'Content-Type': row.mime, 'X-Content-Type-Options': 'nosniff' }
    });
  } catch (error) {
    return fail(error);
  }
}
