import type {Draft,Lot,Profile} from './domain';
export interface Snapshot {scope:string;lots:Lot[];profile:Profile;savedAt?:string}
const DB_NAME='echakra-offline-v1';
let opened:Promise<IDBDatabase>|undefined;
function db(){return opened??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{r.result.createObjectStore('data')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>{opened=undefined;reject(new Error('Device storage is unavailable. Enable browser storage to save offline.'))}})}
export async function read<T>(key:string):Promise<T|undefined>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('data','readonly').objectStore('data').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function write(key:string,value:unknown){const d=await db();return new Promise<void>((resolve,reject)=>{const tx=d.transaction('data','readwrite');tx.objectStore('data').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
export async function drop(key:string){const d=await db();return new Promise<void>((resolve,reject)=>{const tx=d.transaction('data','readwrite');tx.objectStore('data').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export const draftKey=(scope:string)=>'drafts:'+scope;
export async function getDrafts(scope:string){return await read<Draft[]>(draftKey(scope))||[]}
async function updateDrafts(scope:string,change:(drafts:Draft[])=>Draft[]){const d=await db();return new Promise<void>((resolve,reject)=>{const tx=d.transaction('data','readwrite'),store=tx.objectStore('data'),r=store.get(draftKey(scope));r.onsuccess=()=>store.put(change(r.result||[]),draftKey(scope));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
export async function putDraft(scope:string,draft:Draft){await updateDrafts(scope,all=>[draft,...all.filter(d=>d.id!==draft.id)])}
export async function removeDraft(scope:string,id:string){await updateDrafts(scope,all=>all.filter(d=>d.id!==id))}
export async function api<T=Snapshot>(input?:unknown){const r=await fetch('/api/ec',{method:input?'POST':'GET',credentials:'same-origin',headers:input?{'Content-Type':'application/json'}:{},body:input?JSON.stringify(input):undefined,cache:'no-store'});const data=await r.json() as T & {error?:string};if(!r.ok)throw new Error(data.error||'Connection failed');return data}
export async function upload(id:string,blob:Blob){const r=await fetch('/api/media?id='+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':blob.type},body:blob});if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'Attachment upload failed')}}
export async function compressImage(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Please choose a JPG, PNG or WebP image.');
 if(file.size>15000000)throw new Error('Please choose an image smaller than 15 MB.');
 const img=await createImageBitmap(file);const scale=Math.min(1,1024/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);img.close();
 return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Could not process image')),'image/jpeg',.76));
}
