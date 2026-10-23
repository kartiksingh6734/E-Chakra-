import { DomainError } from '../lib/domain';
import { readLimited } from '../lib/http';

const CHUNK_BYTES = 250_000;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/ogg']);

// Small, capped demo files live in D1 to avoid an R2 billing subscription.
// Replace this adapter with object storage before a production field pilot.
export async function uploadMedia(request: Request, db: D1Database, owner: string) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw new DomainError('Invalid attachment reference');
  const mime = (request.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!MIME_TYPES.has(mime)) throw new DomainError('Unsupported file type');
  const bytes = await readLimited(request, 2_000_000);
  if (!bytes.byteLength) throw new DomainError('Empty attachment');
  const existing = await db.prepare('SELECT owner FROM media WHERE id=?').bind(id).first<{owner: string}>();
  if (existing) {
    if (existing.owner !== owner) throw new DomainError('Attachment reference already used', 409);
    return Response.json({id});
  }
  const statements = [db.prepare('INSERT INTO media(id,owner,mime,byte_length,created_at) VALUES(?,?,?,?,?)')
    .bind(id, owner, mime, bytes.byteLength, new Date().toISOString())];
  for (let start = 0; start < bytes.length; start += CHUNK_BYTES) {
    statements.push(db.prepare('INSERT INTO media_chunks(media_id,part,body) VALUES(?,?,?)')
      .bind(id, start / CHUNK_BYTES, bytes.slice(start, start + CHUNK_BYTES).buffer));
  }
  // D1 batches are transactional: a failed chunk cannot leave a partial upload.
  await db.batch(statements);
  return Response.json({id});
}

export async function downloadMedia(request: Request, db: D1Database, owner: string) {
  const id = new URL(request.url).searchParams.get('id') || '';
  const record = await db.prepare('SELECT mime,byte_length FROM media WHERE id=? AND owner=?')
    .bind(id, owner).first<{mime: string; byte_length: number}>();
  if (!record) throw new DomainError('Attachment not found', 404);
  const chunks = await db.prepare('SELECT body FROM media_chunks WHERE media_id=? ORDER BY part')
    .bind(id).all<{body: number[]}>();
  const bytes = new Uint8Array(record.byte_length);
  let offset = 0;
  for (const row of chunks.results) { bytes.set(row.body, offset); offset += row.body.length; }
  if (offset !== record.byte_length) throw new DomainError('Attachment unavailable', 503);
  return new Response(bytes, {headers: {
    'Content-Type': record.mime,
    'Content-Length': String(bytes.length),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }});
}
