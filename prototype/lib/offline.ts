import type {Draft,Lot,Profile} from './domain';
export interface Snapshot {scope:string;lots:Lot[];profile:Profile;savedAt?:string}
import {deviceSignal, isPagesDemo, pagesScope} from './device-storage';
import {result, withStore} from './device-db';

export function read<T>(key:string,scope?:string):Promise<T|undefined>{
 return withStore('readonly',scope,(store,name)=>result(store.get(name(key))));
}
export function drop(key:string){
 return withStore('readwrite',undefined,(store,name)=>{store.delete(name(key))});
}
export const draftKey=(scope:string)=>'drafts:'+scope;
export async function getDrafts(scope:string){return await read<Draft[]>(draftKey(scope),scope)||[]}

export function saveSnapshot(snapshot:Snapshot) {
 return withStore('readwrite',snapshot.scope,(store,key)=>{
  store.put({...snapshot,savedAt:new Date().toISOString()},key('snapshot:'+snapshot.scope));
  store.put(snapshot.scope,key('active-scope'));
 });
}
export async function readActiveSnapshot(){
 if(isPagesDemo){
  const scope=pagesScope();
  return read<Snapshot>('snapshot:'+scope,scope);
 }
 const scope=await read<string>('active-scope');
 return scope?read<Snapshot>('snapshot:'+scope):undefined;
}

function changeDraft(scope:string,id:string,change:(current:Draft|undefined)=>Draft|undefined) {
 return withStore('readwrite',scope,async(store,key)=>{
  const name=key(draftKey(scope));
  const drafts:Draft[]=await result(store.get(name))??[];
  const index=drafts.findIndex(d=>d.id===id);
  const updated=change(drafts[index]);
  if(index<0 && !updated)return;
  if(index<0 && updated)drafts.unshift(updated);
  else if(updated)drafts[index]=updated;
  else drafts.splice(index,1);
  store.put(drafts,name);
  return updated;
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
 return withStore('readwrite',scope,async(store,key)=>{
  const record=key('snapshot:'+scope);
  const snapshot:Snapshot|undefined=await result(store.get(record));
  if(!snapshot)throw new Error('Could not cache the uploaded lot. Please retry.');
  store.put(withSavedLot(snapshot,lot),record);
  const queued=key(draftKey(scope));
  const drafts:Draft[]=await result(store.get(queued))??[];
  store.put(drafts.filter(d=>d.id!==draft.id),queued);
  if(draft.photo && lot.photoId===draft.photoId)store.put(draft.photo,key('media:'+scope+':'+lot.photoId));
  if(draft.audio && lot.audioId===draft.audioId)store.put(draft.audio,key('media:'+scope+':'+lot.audioId));
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
 if(isPagesDemo){
  const current=scope??pagesScope();
  const {localRequest}=await import('../github-pages/store');
  return localRequest(current,input);
 }
 const post=input!==undefined;
 const r=await fetch('/api/ec',{signal:deviceSignal(),method:post?'POST':'GET',credentials:'same-origin',headers:post?{'Content-Type':'application/json','X-E-Chakra-Scope':scope!}:{},body:post?JSON.stringify(input):undefined,cache:'no-store'});
 await checkResponse(r,'Connection failed');
 return r.json();
}
export async function upload(scope:string,id:string,blob:Blob){
 if(isPagesDemo){
  const {saveMedia}=await import('../github-pages/store');
  return saveMedia(scope,id,blob);
 }
 const r=await fetch('/api/media?id='+encodeURIComponent(id),{signal:deviceSignal(),method:'PUT',headers:{'Content-Type':blob.type,'X-E-Chakra-Scope':scope},body:blob});
 await checkResponse(r,'Attachment upload failed');
}
export async function compressImage(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Please choose a JPG, PNG or WebP image.');
 if(file.size>15000000)throw new Error('Please choose an image smaller than 15 MB.');
 const img=await createImageBitmap(file);const scale=Math.min(1,1024/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);img.close();
 return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Could not process image')),'image/jpeg',.76));
}
