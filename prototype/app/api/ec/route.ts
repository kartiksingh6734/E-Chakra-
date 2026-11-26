import { z } from 'zod';
import { database, ownerOf, checkScope, scopeOf, sameOrigin, fail } from '@/lib/server';
import { readBoundedBody } from '@/lib/request-body';
import { DomainError, mutateLot, type Lot } from '@/lib/domain';
import { defaultProfile, lotFromDraft, profileInput } from '@/lib/collector-input';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 try{
  const owner=ownerOf(request);const db=database();
  const [rows,p]=await Promise.all([db.prepare('SELECT body FROM lots WHERE owner=? ORDER BY updated_at DESC LIMIT 500').bind(owner).all<{body:string}>(),db.prepare('SELECT body FROM profiles WHERE owner=?').bind(owner).first<{body:string}>()]);
  const scope=await scopeOf(owner);
  return json({scope,lots:rows.results.map(r=>JSON.parse(r.body)),profile:p?JSON.parse(p.body):defaultProfile,samplePrices:true});
 }catch(e){return fail(e)}
}
export async function POST(request:Request){
 try{
  sameOrigin(request);
  const owner = ownerOf(request);
  await checkScope(request, owner);
  const db = database();
  // A UTF-16 code unit needs at most three UTF-8 bytes. Bound the stream even
  // when Content-Length is absent, then preserve the existing character limit.
  const raw = new TextDecoder().decode(await readBoundedBody(request, 20_000 * 3));
  if (raw.length > 20_000) throw new DomainError('Request is too large', 413);
  let parsed: unknown;
  try {
   parsed = JSON.parse(raw);
  } catch {
   throw new DomainError('Invalid JSON request');
  }
  const input = z.record(z.string(), z.unknown()).parse(parsed);
  if(input.action==='profile'){
   const p=profileInput.parse(input.profile);
   await db.prepare('INSERT INTO profiles(owner,body) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET body=excluded.body').bind(owner,JSON.stringify(p)).run();return json({profile:p});
  }
  if(input.action==='create_lot'){
   const lot = lotFromDraft(input.lot);
   for (const [id, family] of [[lot.photoId, 'image/'], [lot.audioId, 'audio/']] as const) {
    if (!id) continue;
    const media = await db.prepare('SELECT mime FROM media WHERE id=? AND owner=?')
     .bind(id, owner).first<{mime: string}>();
    if (!media) throw new DomainError('Upload the photo or recording before submitting the lot');
    if (!media.mime.startsWith(family)) throw new DomainError('The attachment type does not match its field');
   }
   await db.prepare('INSERT INTO lots(owner,id,body,version,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,id) DO NOTHING').bind(owner,lot.id,JSON.stringify(lot),1,lot.updatedAt).run();
   const row=await db.prepare('SELECT body FROM lots WHERE owner=? AND id=?').bind(owner,lot.id).first<{body:string}>();
   return json({lot:JSON.parse(row!.body)});
  }
  const id=z.string().uuid().parse(input.id);
  const row=await db.prepare('SELECT body,version FROM lots WHERE owner=? AND id=?').bind(owner,id).first<{body:string;version:number}>();
  if(!row)throw new DomainError('Lot not found',404);
  const current=JSON.parse(row.body) as Lot;
  const lot=mutateLot(current,input);
  if(lot.version===current.version)return json({lot});
  const saved=await db.prepare('UPDATE lots SET body=?,version=?,updated_at=? WHERE owner=? AND id=? AND version=?').bind(JSON.stringify(lot),lot.version,lot.updatedAt,owner,id,row.version).run();
  if (saved.meta.changes !== 1) {
   // Two retries can both read the original version before either writes.
   const latest = await db.prepare('SELECT body FROM lots WHERE owner=? AND id=?')
    .bind(owner, id).first<{body: string}>();
   if (latest) {
    const stored = JSON.parse(latest.body) as Lot;
    if (stored.operations.includes(input.opId as string)) return json({lot: stored});
   }
   throw new DomainError('This record changed. Refresh and try again.', 409);
  }
  return json({lot});
 } catch (error) {
  return fail(error);
 }
}
