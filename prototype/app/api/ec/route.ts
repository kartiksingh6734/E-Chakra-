import { z } from 'zod';
import { database, ownerOf, sameOrigin, fail } from '@/lib/server';
import { CATEGORIES, categoryOf, DomainError, mutateLot, type Lot } from '@/lib/domain';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const draftSchema=z.object({id:z.string().uuid(),category:z.enum(['pcb','cables','lcd','crt','batteries','motors','magnets','plastics']),quantity:z.number().positive().max(100000),condition:z.enum(['scrap','reusable']),location:z.string().trim().min(2).max(150),notes:z.string().max(500).default(''),photoId:z.string().uuid().optional(),audioId:z.string().uuid().optional(),createdAt:z.string().datetime()});
export async function GET(request:Request){
 try{
  const owner=ownerOf(request);const db=database();
  const [rows,p]=await Promise.all([db.prepare('SELECT body FROM lots WHERE owner=? ORDER BY updated_at DESC LIMIT 500').bind(owner).all<{body:string}>(),db.prepare('SELECT body FROM profiles WHERE owner=?').bind(owner).first<{body:string}>()]);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner));
  const scope=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,24);
  return json({scope,lots:rows.results.map(r=>JSON.parse(r.body)),profile:p?JSON.parse(p.body):{name:'',location:'Mayapuri, Delhi',language:'hi'},samplePrices:true});
 }catch(e){return fail(e)}
}
export async function POST(request:Request){
 try{
  sameOrigin(request);const owner=ownerOf(request),db=database();
  const raw=await request.text();if(raw.length>20000)throw new DomainError('Request is too large',413);
  const input=JSON.parse(raw);
  if(input.action==='profile'){
   const p=z.object({name:z.string().trim().max(60),location:z.string().trim().min(2).max(150),language:z.enum(['hi','mr','en'])}).parse(input.profile);
   await db.prepare('INSERT INTO profiles(owner,body) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET body=excluded.body').bind(owner,JSON.stringify(p)).run();return json({profile:p});
  }
  if(input.action==='create_lot'){
   const d=draftSchema.parse(input.lot);
   if(categoryOf(d.category).unit==='piece'&&!Number.isInteger(d.quantity))throw new DomainError('Enter a whole number of pieces');
   for(const id of [d.photoId,d.audioId].filter(Boolean)){
    if(!await db.prepare('SELECT id FROM media WHERE id=? AND owner=?').bind(id,owner).first())throw new DomainError('Upload the photo or recording before submitting the lot');
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
  if(saved.meta.changes!==1)throw new DomainError('This record changed. Refresh and try again.',409);
  return json({lot});
 }catch(e){if(e instanceof SyntaxError)return json({error:'Invalid request'},400);return fail(e)}
}
