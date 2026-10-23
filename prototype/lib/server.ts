import { env } from 'cloudflare:workers';
import { DomainError } from './domain';
export function database(){if(!env.DB)throw new DomainError('Storage is temporarily unavailable.',503);return env.DB}
export function bucket(){if(!env.BUCKET)throw new DomainError('Photo storage is temporarily unavailable.',503);return env.BUCKET}
export function ownerOf(request:Request){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(owner)return owner;
 if(import.meta.env.DEV)return 'development-collector';
 throw new DomainError('Please sign in again to access your records.',401);
}
export { sameOrigin, fail } from './http';
