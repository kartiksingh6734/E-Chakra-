import { database,bucket,ownerOf,sameOrigin,fail } from '@/lib/server';
import { DomainError } from '@/lib/domain';
export const dynamic='force-dynamic';
export async function PUT(request:Request){
 try{
  sameOrigin(request);const owner=ownerOf(request);const id=new URL(request.url).searchParams.get('id')||'';
  if(!/^[0-9a-f-]{36}$/.test(id))throw new DomainError('Invalid attachment reference');
  const mime=(request.headers.get('content-type')||'').split(';')[0];
  if(!['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/ogg'].includes(mime))throw new DomainError('Unsupported file type');
  const body=await request.arrayBuffer();if(!body.byteLength||body.byteLength>2000000)throw new DomainError('Keep attachments below 2 MB',413);
  const existing=await database().prepare('SELECT owner FROM media WHERE id=?').bind(id).first<{owner:string}>();
  if(existing){if(existing.owner!==owner)throw new DomainError('Attachment reference already used',409);return Response.json({id})}
  const key=crypto.randomUUID();
  await bucket().put(key,body,{httpMetadata:{contentType:mime}});
  try{await database().prepare('INSERT INTO media(id,owner,mime,object_key,created_at) VALUES(?,?,?,?,?)').bind(id,owner,mime,key,new Date().toISOString()).run()}
  catch(error){await bucket().delete(key);throw error}
  return Response.json({id});
 }catch(e){return fail(e)}
}
export async function GET(request:Request){
 try{
  const owner=ownerOf(request),id=new URL(request.url).searchParams.get('id')||'';
  const row=await database().prepare('SELECT object_key,mime FROM media WHERE id=? AND owner=?').bind(id,owner).first<{object_key:string;mime:string}>();
  if(!row)throw new DomainError('Attachment not found',404);
  const obj=await bucket().get(row.object_key);if(!obj)throw new DomainError('Attachment unavailable',404);
  return new Response(obj.body,{headers:{'Content-Type':row.mime,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch(e){return fail(e)}
}
