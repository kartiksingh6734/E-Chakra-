import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=process.cwd();const port=8794,base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port',String(port),'--inspector-port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function req(path,body,owner='integration-owner',method){
 const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{...(owner?{'oai-authenticated-user-id':owner}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}return {status:r.status,data};
}
try{
 let ready=false;for(let i=0;i<40;i++){await sleep(500);try{const r=await req('/api/ec');if(r.status===200){ready=true;break}}catch{}}
 if(!ready)throw new Error('Local built API did not start. '+logs.slice(-2500));
 assert.equal((await req('/api/ec',null,'')).status,401);
 const d={id:crypto.randomUUID(),category:'pcb',quantity:10,condition:'scrap',location:'Test facility',notes:'integration-test',createdAt:new Date().toISOString()};
 const created=await req('/api/ec',{action:'create_lot',lot:d});assert.equal(created.status,200);let lot=created.data.lot;
 const retry=await req('/api/ec',{action:'create_lot',lot:d});assert.equal(retry.data.lot.id,lot.id);
 assert.equal((await req('/api/ec',{action:'create_lot',lot:{...d,id:crypto.randomUUID(),quantity:-3}})).status,400);
 async function act(action,role,extra={}){const r=await req('/api/ec',{action,id:lot.id,version:lot.version,opId:crypto.randomUUID(),role,...extra});assert.equal(r.status,200,JSON.stringify(r.data));lot=r.data.lot;return lot}
 await act('sample_offers','collector');
 const denied=await req('/api/ec',{action:'accept_offer',id:lot.id,version:lot.version,opId:crypto.randomUUID(),role:'collector',offerId:lot.offers[0].id},'other-owner');assert.equal(denied.status,404);
 await act('accept_offer','collector',{offerId:lot.offers[0].id});
 await act('propose_handover','recycler',{quantity:9,amount:3000,location:'Test receiving desk'});
 await act('confirm_handover','collector');
 await act('record_payment','recycler',{amount:3000,method:'cash'});
 assert.equal(lot.stage,'received');assert.equal(lot.payments[0].confirmedAt,undefined);
 await act('confirm_payment','collector',{paymentId:lot.payments[0].id});assert.equal(lot.stage,'paid');
 const snapshot=await req('/api/ec');assert.equal(snapshot.data.lots.find(l=>l.id===lot.id).stage,'paid');
 assert.ok(!(await req('/api/ec',null,'other-owner')).data.lots.some(l=>l.id===lot.id));
 const id=crypto.randomUUID(),img=await readFile('public/icon-192.png');
 const up=await fetch(base+'/api/media?id='+id,{method:'PUT',headers:{'Content-Type':'image/png','oai-authenticated-user-id':'integration-owner'},body:img});assert.equal(up.status,200);
 const media=await fetch(base+'/api/media?id='+id,{headers:{'oai-authenticated-user-id':'integration-owner'}});assert.equal(media.status,200);assert.equal((await media.arrayBuffer()).byteLength,img.byteLength);
 assert.equal((await req('/api/media?id='+id,null,'other-owner')).status,404);
 const wrongOrigin=await fetch(base+'/api/ec',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://not-this-app.invalid','oai-authenticated-user-id':'integration-owner'},body:JSON.stringify({action:'profile',profile:{name:'x',location:'Delhi',language:'en'}})});assert.equal(wrongOrigin.status,403);
 const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/E-CHAKRA/);
 for(const path of ['/manifest.webmanifest','/sw.js','/icon-192.png','/icon-512.png'])assert.equal((await fetch(base+path)).status,200,path);
 console.log('PASS: built API full lot-to-payment journey, retry safety, validation, private media, account isolation, missing identity, origin checks and PWA assets.');
}finally{server.kill('SIGTERM')}
