import type {Draft,Lot,Profile} from './domain';
export interface Snapshot {scope:string;lots:Lot[];profile:Profile;savedAt?:string}
import {databaseName, deviceSignal} from './device-storage';
let opened:Promise<IDBDatabase>|undefined;
function db():Promise<IDBDatabase>{
 const signal=deviceSignal();
 if (!opened) {
  opened=new Promise<IDBDatabase>((resolve,reject)=>{
   const request=indexedDB.open(databaseName,1);
   request.onupgradeneeded=()=>request.result.createObjectStore('data');
   request.onsuccess=()=>{
    const connection=request.result;
    function close(){connection.close();opened=undefined;signal.removeEventListener('abort',close)}
    connection.onversionchange=close;
    if(signal.aborted){close();reject(new Error('Offline storage is paused.'));return}
    signal.addEventListener('abort',close,{once:true});
    resolve(connection);
   };
   request.onerror=()=>reject(new Error('Device storage is unavailable. Enable browser storage to save offline.'));
  }).catch(error=>{opened=undefined;throw error});
 }
 return opened;
}
export async function read<T>(key:string):Promise<T|undefined>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('data','readonly').objectStore('data').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function write(key:string,value:unknown){const d=await db();return new Promise<void>((resolve,reject)=>{const tx=d.transaction('data','readwrite');tx.objectStore('data').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
export async function drop(key:string){const d=await db();return new Promise<void>((resolve,reject)=>{const tx=d.transaction('data','readwrite');tx.objectStore('data').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export const draftKey=(scope:string)=>'drafts:'+scope;
export async function getDrafts(scope:string){return await read<Draft[]>(draftKey(scope))||[]}
// Keep the last verified workspace and its data in one transaction.
export async function saveSnapshot(snapshot:Snapshot) {
 const database=await db();
 return new Promise<void>((resolve,reject)=>{
  const tx=database.transaction('data','readwrite'),store=tx.objectStore('data');
  store.put({...snapshot,savedAt:new Date().toISOString()},'snapshot:'+snapshot.scope);
  store.put(snapshot.scope,'active-scope');
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error);
 });
}
export async function readActiveSnapshot(){
 const scope=await read<string>('active-scope');
 return scope?read<Snapshot>('snapshot:'+scope):undefined;
}

async function changeDraft(scope:string,id:string,change:(current:Draft|undefined)=>Draft|undefined) {
 const database=await db();
 return new Promise<Draft|undefined>((resolve,reject)=>{
  const tx=database.transaction('data','readwrite'),store=tx.objectStore('data');
  const request=store.get(draftKey(scope));
  let updated:Draft|undefined;
  request.onsuccess=()=>{
   const drafts:Draft[]=request.result??[];
   const index=drafts.findIndex(d=>d.id===id);
   updated=change(drafts[index]);
   if(index<0 && !updated)return;
   if(index<0 && updated)drafts.unshift(updated);
   else if(updated)drafts[index]=updated;
   else drafts.splice(index,1);
   store.put(drafts,draftKey(scope));
  };
  tx.oncomplete=()=>resolve(updated);
  tx.onabort=()=>reject(tx.error);
 });
}
export function putDraft(scope:string,draft:Draft){return changeDraft(scope,draft.id,()=>draft)}
export function markDraftError(scope:string,id:string,error:string){
 return changeDraft(scope,id,current=>current&&{...current,error});
}
// Older queued drafts may lack attachment IDs. Assign them inside the write
// transaction so two open tabs always retry the same upload.
export function prepareDraft(scope:string,id:string){
 return changeDraft(scope,id,current=>{
  if(current?.photo)current.photoId??=crypto.randomUUID();
  if(current?.audio)current.audioId??=crypto.randomUUID();
  return current;
 });
}

export function withSavedLot(snapshot:Snapshot,lot:Lot):Snapshot {
 const existing=snapshot.lots.find(item=>item.id===lot.id);
 if(existing && existing.version>lot.version)return snapshot;
 const lots=[lot,...snapshot.lots.filter(item=>item.id!==lot.id)];
 lots.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 return {...snapshot,lots:lots.slice(0,500),savedAt:new Date().toISOString()};
}

// Commit the server acknowledgement and dequeue together. If the tab closes or
// the device runs out of space, the old draft and its media remain retryable.
export async function acknowledgeDraft(scope:string,lot:Lot,draft:Draft){
 const database=await db();
 return new Promise<void>((resolve,reject)=>{
  const tx=database.transaction('data','readwrite'),store=tx.objectStore('data');
  const snapshot=store.get('snapshot:'+scope);
  snapshot.onsuccess=()=>{
   if(!snapshot.result){tx.abort();return}
   store.put(withSavedLot(snapshot.result,lot),'snapshot:'+scope);
   const drafts=store.get(draftKey(scope));
   drafts.onsuccess=()=>store.put((drafts.result as Draft[]??[]).filter(d=>d.id!==draft.id),draftKey(scope));
   if(draft.photo && lot.photoId===draft.photoId)store.put(draft.photo,'media:'+scope+':'+lot.photoId);
   if(draft.audio && lot.audioId===draft.audioId)store.put(draft.audio,'media:'+scope+':'+lot.audioId);
  };
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error??new Error('Could not cache the uploaded lot. Please retry.'));
 });
}
export class ApiError extends Error {
 constructor(message:string,public readonly status:number){super(message)}
}
async function checkResponse(response:Response,message:string) {
 if(response.ok)return;
 const data=await response.json().catch(()=>null) as {error?:unknown}|null;
 throw new ApiError(typeof data?.error==='string'?data.error:message,response.status);
}
export function api():Promise<Snapshot>;
export function api<T=unknown>(input:unknown,scope:string):Promise<T>;
export async function api(input?:unknown,scope?:string) {
 const post=input!==undefined;
 const r=await fetch('/api/ec',{signal:deviceSignal(),method:post?'POST':'GET',credentials:'same-origin',headers:post?{'Content-Type':'application/json','X-E-Chakra-Scope':scope!}:{},body:post?JSON.stringify(input):undefined,cache:'no-store'});
 await checkResponse(r,'Connection failed');
 return r.json();
}
export async function upload(scope:string,id:string,blob:Blob){
 const r=await fetch('/api/media?id='+encodeURIComponent(id),{signal:deviceSignal(),method:'PUT',headers:{'Content-Type':blob.type,'X-E-Chakra-Scope':scope},body:blob});
 await checkResponse(r,'Attachment upload failed');
}
export async function compressImage(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Please choose a JPG, PNG or WebP image.');
 if(file.size>15000000)throw new Error('Please choose an image smaller than 15 MB.');
 const img=await createImageBitmap(file);const scale=Math.min(1,1024/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);img.close();
 return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Could not process image')),'image/jpeg',.76));
}
