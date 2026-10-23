import { getSnapshot, saveAction } from '../lib/collector-api';
import { DomainError } from '../lib/domain';
import { fail, sameOrigin } from '../lib/http';
import { session } from './session';
import { downloadMedia, uploadMedia } from './media';

interface Env { DB: D1Database; ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
    let response: Response;
    let cookie: string | undefined;
    try {
      sameOrigin(request);
      if (request.headers.get('sec-fetch-site') === 'cross-site') throw new DomainError('Request origin is not allowed', 403);
      if (!['/api/ec', '/api/media'].includes(path)) throw new DomainError('Not found', 404);
      const allowed = path === '/api/ec' ? ['GET', 'POST'] : ['GET', 'PUT'];
      if (!allowed.includes(request.method)) throw new DomainError('Method not allowed', 405);
      // Browser writes need an explicit matching Origin, not just a cookie.
      if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin) {
        throw new DomainError('Request origin is required', 403);
      }
      const identity = await session(request, env.DB, path === '/api/ec' && request.method === 'GET');
      cookie = identity.cookie;
      response = path === '/api/ec'
        ? request.method === 'GET' ? await getSnapshot(env.DB, identity.owner) : await saveAction(request, env.DB, identity.owner)
        : request.method === 'GET' ? await downloadMedia(request, env.DB, identity.owner) : await uploadMedia(request, env.DB, identity.owner);
    } catch (error) {
      response = fail(error);
    }
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('Referrer-Policy', 'same-origin');
    if (cookie) headers.set('Set-Cookie', cookie);
    return new Response(response.body, {status: response.status, headers});
  },
  async scheduled(_event: ScheduledController, env: Env) {
    // Cascades delete only expired demo sessions and their records/attachments.
    try {
      await env.DB.prepare('DELETE FROM sessions WHERE id IN (SELECT id FROM sessions WHERE expires_at<=? LIMIT 100)')
        .bind(Date.now()).run();
    } catch (error) {
      console.error('E-CHAKRA demo retention failed', error instanceof Error ? error.message : 'Database unavailable');
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;
