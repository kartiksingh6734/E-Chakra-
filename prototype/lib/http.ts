import { DomainError } from './domain';
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)throw new DomainError('Request origin is not allowed',403);
}
export function fail(error:unknown){
 if(error instanceof Error&&error.message.includes('DEMO_LIMIT:'))return Response.json({error:'Demo storage capacity reached. Contact the E-CHAKRA team to reset this demo.'},{status:429,headers:{'Cache-Control':'no-store'}});
 if(error instanceof DomainError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
 if(error&&typeof error==='object'&&'issues' in error)return Response.json({error:'Check the required fields and try again.'},{status:400});
 console.error('E-CHAKRA request failed',error instanceof Error?error.message:'Unknown storage error');
 return Response.json({error:'Unable to save right now. Your local draft is safe; please retry.'},{status:503,headers:{'Cache-Control':'no-store'}});
}

export async function readLimited(request: Request, limit: number): Promise<Uint8Array> {
 const declared = Number(request.headers.get('content-length') || '0');
 if (declared > limit) throw new DomainError('Request is too large', 413);
 if (!request.body) return new Uint8Array();
 const reader = request.body.getReader();
 const chunks: Uint8Array[] = [];
 let length = 0;
 try {
  while (true) {
   const {done, value} = await reader.read();
   if (done) break;
   length += value.byteLength;
   if (length > limit) { await reader.cancel(); throw new DomainError('Request is too large', 413); }
   chunks.push(value);
  }
 } finally { reader.releaseLock(); }
 const body = new Uint8Array(length);
 let offset = 0;
 for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
 return body;
}
