import { z } from 'zod';
import { database, ownerOf, checkScope, scopeOf, sameOrigin, fail } from '@/lib/server';
import { readBoundedBody } from '@/lib/request-body';
import { categoryOf, DomainError, mutateLot, type Lot } from '@/lib/domain';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const draftSchema=z.object({id:z.string().uuid(),category:z.enum(['pcb','cables','lcd','crt','batteries','motors','magnets','plastics']),quantity:z.number().positive().max(100000),condition:z.enum(['scrap','reusable']),location:z.string().trim().min(2).max(150),notes:z.string().max(500).default(''),photoId:z.string().uuid().optional(),audioId:z.string().uuid().optional(),createdAt:z.string().datetime()});
export async function GET(request:Request){
 try{
  const owner=ownerOf(request);const db=database();
  const [rows,p]=await Promise.all([db.prepare('SELECT body FROM lots WHERE owner=? ORDER BY updated_at DESC LIMIT 500').bind(owner).all<{body:string}>(),db.prepare('SELECT body FROM profiles WHERE owner=?').bind(owner).first<{body:string}>()]);
  const scope=await scopeOf(owner);
  return json({scope,lots:rows.results.map(r=>JSON.parse(r.body)),profile:p?JSON.parse(p.body):{name:'',location:'Mayapuri, Delhi',language:'hi'},samplePrices:true});
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
   const p=z.object({name:z.string().trim().max(60),location:z.string().trim().min(2).max(150),language:z.enum(['hi','mr','en'])}).parse(input.profile);
   await db.prepare('INSERT INTO profiles(owner,body) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET body=excluded.body').bind(owner,JSON.stringify(p)).run();return json({profile:p});
  }
  if(input.action==='create_lot'){
   const d=draftSchema.parse(input.lot);
   if(categoryOf(d.category).unit==='piece'&&!Number.isInteger(d.quantity))throw new DomainError('Enter a whole number of pieces');
   for (const [id, family] of [[d.photoId, 'image/'], [d.audioId, 'audio/']] as const) {
    if (!id) continue;
    const media = await db.prepare('SELECT mime FROM media WHERE id=? AND owner=?')
     .bind(id, owner).first<{mime: string}>();
    if (!media) throw new DomainError('Upload the photo or recording before submitting the lot');
    if (!media.mime.startsWith(family)) throw new DomainError('The attachment type does not match its field');
   }
   const at=new Date().toISOString();
   const lot:Lot={...d,createdAt:d.createdAt,updatedAt:at,stage:'open',offers:[],payments:[],events:[{at,action:'create_lot',role:'collector'}],operations:[],version:1};
   await db.prepare('INSERT INTO lots(owner,id,body,version,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,id) DO NOTHING').bind(owner,d.id,JSON.stringify(lot),1,at).run();
   const row=await db.prepare('SELECT body FROM lots WHERE owner=? AND id=?').bind(owner,d.id).first<{body:string}>();
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
