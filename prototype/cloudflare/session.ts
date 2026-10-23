import { DomainError } from '../lib/domain';

export const COOKIE = '__Host-echakra_session';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;

async function hash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

// A public judge demo uses an unguessable browser session, not a collector identity.
// In particular, caller-supplied Sites identity headers are never trusted here.
export async function session(request: Request, db: D1Database, create: boolean) {
  const token = request.headers.get('cookie')?.split(';').map(v => v.trim())
    .find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const id = await hash(token);
    const row = await db.prepare('SELECT id FROM sessions WHERE id=? AND expires_at>?')
      .bind(id, Date.now()).first<{id: string}>();
    if (row) return {owner: row.id, cookie: undefined};
  }
  if (!create) throw new DomainError('Open the home screen online to start a demo session.', 401);
  const value = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const owner = await hash(value);
  await db.prepare('INSERT INTO sessions(id,expires_at) VALUES(?,?)')
    .bind(owner, Date.now() + SESSION_SECONDS * 1000).run();
  return {owner, cookie: `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`};
}
