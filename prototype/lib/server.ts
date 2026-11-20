import { env } from 'cloudflare:workers';
import { DomainError } from './domain';

export function database() {
 if (!env.DB) throw new DomainError('Storage is temporarily unavailable.', 503);
 return env.DB;
}

export function bucket() {
 if (!env.BUCKET) throw new DomainError('Photo storage is temporarily unavailable.', 503);
 return env.BUCKET;
}

export function ownerOf(request: Request) {
 const owner = request.headers.get('oai-authenticated-user-id');
 if (owner) return owner;
 if (import.meta.env.DEV) return 'development-collector';
 throw new DomainError('Please sign in again to access your records.', 401);
}

export async function scopeOf(owner: string): Promise<string> {
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(owner));
 return Array.from(new Uint8Array(digest).subarray(0, 12), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function checkScope(request: Request, owner: string) {
 const expected = request.headers.get('X-E-Chakra-Scope');
 if (expected !== null && expected !== await scopeOf(owner)) {
  throw new DomainError('The signed-in account changed. Refresh before continuing.', 409);
 }
}

export function sameOrigin(request: Request) {
 const origin = request.headers.get('origin');
 if (origin && origin !== new URL(request.url).origin) throw new DomainError('Request origin is not allowed', 403);
}

export function fail(error: unknown) {
 const headers = {'Cache-Control': 'no-store'};
 if (error instanceof DomainError) return Response.json({error: error.message}, {status: error.status, headers});
 if (error && typeof error === 'object' && 'issues' in error) {
  return Response.json({error: 'Check the required fields and try again.'}, {status: 400, headers});
 }
 console.error('E-CHAKRA request failed', error instanceof Error ? error.message : 'Unknown storage error');
 return Response.json({error: 'Storage is temporarily unavailable. Please retry.'}, {status: 503, headers});
}
