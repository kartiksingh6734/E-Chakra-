'use client';
import {useState,useEffect,useRef,useCallback,type ReactNode} from 'react';
import {Home,Package,IndianRupee,BookOpen,LifeBuoy,Plus,Camera,Wifi,WifiOff,RefreshCw,MapPin,ChevronRight,ArrowLeft,User,Recycle,ShieldCheck,Download,Volume2,Mic,Square,Trash2,Info,CheckCircle2,Clock,Truck,Store,Search,Cpu,Cable,Monitor,MonitorOff,Battery,Cog,Magnet,AlertTriangle,Settings,CloudUpload,ImagePlus,LogOut,ClipboardCheck,ReceiptText} from 'lucide-react';
import {NativeSelect} from '@/components/ui/native-select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Toaster,toast} from 'sonner';
import {CATEGORIES,BUYERS,categoryOf,money,selectedOffer,offerTotal,received,pending,validBuyer,type Lang,type Role,type Material,type Lot,type Draft,type Profile} from '@/lib/domain';
import {tr,type Key} from '@/lib/i18n';
import {api,read,write,getDrafts,putDraft,removeDraft,upload,compressImage,type Snapshot} from '@/lib/offline';

type Page='home'|'lots'|'create'|'lot'|'prices'|'records'|'help'|'settings';
const ICONS={cpu:Cpu,cable:Cable,monitor:Monitor,tv:MonitorOff,battery:Battery,cog:Cog,magnet:Magnet,recycle:Recycle};
const NAV:{id:Page;label:Key;icon:typeof Home}[]=[{id:'home',label:'home',icon:Home},{id:'lots',label:'lots',icon:Package},{id:'prices',label:'prices',icon:IndianRupee},{id:'records',label:'records',icon:BookOpen},{id:'help',label:'help',icon:LifeBuoy}];
const EVENT_NAMES:Record<string,Key>={create_lot:'created',sample_offers:'samplesAdded',create_offer:'offerSent',accept_offer:'accepted',propose_handover:'handover',confirm_handover:'receivedStage',record_payment:'paymentRecorded',confirm_payment:'paymentConfirmed',dispute:'disputed'};
function MaterialIcon({id,size=25}:{id:Material;size?:number}){const Icon=ICONS[categoryOf(id).icon as keyof typeof ICONS];return <Icon size={size} strokeWidth={1.8}/>}
function BlobPhoto({blob,src,alt}:{blob?:Blob;src?:string;alt:string}){const [url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return}const u=URL.createObjectURL(blob);setUrl(u);return()=>URL.revokeObjectURL(u)},[blob]);return (url||src)?<img src={url||src} alt={alt}/>:null}
function AttachmentAudio({blob,src}:{blob?:Blob;src?:string}){const [url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return}const u=URL.createObjectURL(blob);setUrl(u);return()=>URL.revokeObjectURL(u)},[blob]);return (url||src)?<audio className="audio-preview" controls src={url||src}/>:null}
function saveDownload(text:string,name:string,type='text/plain;charset=utf-8'){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)}
function statusKey(lot:Lot):Key{return lot.stage==='received'?'receivedStage':lot.stage}
function formatDate(value:string,lang:Lang){return new Intl.DateTimeFormat(lang==='hi'?'hi-IN':lang==='mr'?'mr-IN':'en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <div className="field"><label>{label}{children}</label>{hint&&<small>{hint}</small>}</div>}

export default function CollectorApp(){
 const [lang,setLang]=useState<Lang>('hi'),[role,setRole]=useState<Role>('collector'),[page,setPage]=useState<Page>('home'),[lotId,setLotId]=useState('');
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[drafts,setDrafts]=useState<Draft[]>([]),[media,setMedia]=useState<Record<string,Blob>>({});
 const [online,setOnline]=useState(true),[busy,setBusy]=useState(false),[syncing,setSyncing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[reportOpen,setReportOpen]=useState(false),[issue,setIssue]=useState('');
 const [category,setCategory]=useState<Material|''>(''),[quantity,setQuantity]=useState(''),[condition,setCondition]=useState<'scrap'|'reusable'>('scrap'),[location,setLocation]=useState('Mayapuri, Delhi'),[notes,setNotes]=useState(''),[photo,setPhoto]=useState<Blob>(),[audio,setAudio]=useState<Blob>(),[recording,setRecording]=useState(false);
 const [profile,setProfile]=useState<Profile>({name:'',location:'Mayapuri, Delhi',language:'hi'});
 const [buyerId,setBuyerId]=useState('recycler-a'),[offerRate,setOfferRate]=useState(''),[offerCharge,setOfferCharge]=useState('0'),[pickup,setPickup]=useState(true);
 const [handoverQty,setHandoverQty]=useState(''),[finalAmount,setFinalAmount]=useState(''),[handoverPlace,setHandoverPlace]=useState('');
 const [paymentAmount,setPaymentAmount]=useState(''),[paymentMethod,setPaymentMethod]=useState<'cash'|'upi'>('cash'),[paymentReference,setPaymentReference]=useState('');
 const [installEvent,setInstallEvent]=useState<any>(null);
 const stateRef=useRef<Snapshot|null>(null),syncLock=useRef(false),recordRef=useRef<MediaRecorder|null>(null),recordTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const t=(k:Key)=>tr(lang,k),lots=snapshot?.lots||[],lot=lots.find(l=>l.id===lotId);
 const notifyError=(e:unknown)=>{const msg=e instanceof Error?e.message:String(e);setError(msg);toast.error(msg)};
 const hydrate=useCallback(async(s:Snapshot)=>{
  stateRef.current=s;setSnapshot(s);await write('snapshot:'+s.scope,{...s,savedAt:new Date().toISOString()});await write('active-scope',s.scope);
  setDrafts(await getDrafts(s.scope));
  const ids=s.lots.flatMap(l=>[l.photoId,l.audioId]).filter(Boolean) as string[];const blobs:Record<string,Blob>={};
  for(const id of ids){const b=await read<Blob>('media:'+s.scope+':'+id);if(b)blobs[id]=b}
  setMedia(blobs);
 },[]);
 const refresh=useCallback(async()=>{
  const s=await api() as Snapshot;await hydrate(s);return s;
 },[hydrate]);
 const sync=useCallback(async()=>{
  if(syncLock.current||!navigator.onLine||!stateRef.current)return;
  syncLock.current=true;setSyncing(true);
  const scope=stateRef.current.scope;
  try{
   for(const d of await getDrafts(scope)){
    try{
     if(d.photo){d.photoId??=crypto.randomUUID();await putDraft(scope,d);await upload(d.photoId,d.photo);await write('media:'+scope+':'+d.photoId,d.photo)}
     if(d.audio){d.audioId??=crypto.randomUUID();await putDraft(scope,d);await upload(d.audioId,d.audio);await write('media:'+scope+':'+d.audioId,d.audio)}
     const {photo:_,audio:__,error:___,...payload}=d;
     await api({action:'create_lot',lot:payload});await removeDraft(scope,d.id);
    }catch(e){d.error=e instanceof Error?e.message:'Upload failed';await putDraft(scope,d);if(!navigator.onLine)break}
   }
   await refresh();setError('');
  }catch(e){setError(e instanceof Error?e.message:'Sync failed')}
  finally{setDrafts(await getDrafts(scope));syncLock.current=false;setSyncing(false)}
 },[refresh]);
 useEffect(()=>{
  let gone=false;
  const boot=async()=>{
   try{
    const l=localStorage.getItem('echakra-language');if(l==='en'||l==='hi'||l==='mr')setLang(l);
    const r=sessionStorage.getItem('echakra-role');if(r==='recycler')setRole(r);
    const scope=await read<string>('active-scope');if(scope){const cached=await read<Snapshot>('snapshot:'+scope);if(cached&&!gone){await hydrate(cached);setLocation(cached.profile.location);setProfile(cached.profile)}}
    if(navigator.onLine){const s=await refresh();if(!gone){setLocation(s.profile.location);setProfile(s.profile);if(!l)setLang(s.profile.language);await sync()}}
   }catch(e){if(!gone)setError(e instanceof Error?e.message:'Could not load records')}
   finally{if(!gone){setOnline(navigator.onLine);setLoading(false)}}
  };
  void boot();
  const onOnline=()=>{setOnline(true);void refresh().then(()=>sync()).catch(e=>setError(e.message))};
  const onOffline=()=>setOnline(false);
  const onHash=()=>{const [p,id]=locationHash();if(['home','lots','create','lot','prices','records','help','settings'].includes(p)){setPage(p as Page);setLotId(id||'')}};
  const onInstall=(e:Event)=>{e.preventDefault();setInstallEvent(e)};
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);window.addEventListener('hashchange',onHash);window.addEventListener('beforeinstallprompt',onInstall);onHash();
  if('serviceWorker' in navigator&&!import.meta.env.DEV){
   navigator.serviceWorker.register('/sw.js').then(async reg=>{await navigator.serviceWorker.ready;const cache=()=>reg.active?.postMessage({type:'CACHE_SHELL',urls:[...Array.from(document.querySelectorAll('script[src],link[rel=stylesheet]')).map(e=>(e as HTMLScriptElement).src||(e as HTMLLinkElement).href),...performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\.(js|css|woff2?)(\?|$)/.test(n))]});cache();setTimeout(cache,3000)}).catch(()=>{});
  }
  return()=>{gone=true;window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);window.removeEventListener('hashchange',onHash);window.removeEventListener('beforeinstallprompt',onInstall);if(recordRef.current?.state==='recording')recordRef.current.stop();clearTimeout(recordTimer.current)}
 },[hydrate,refresh,sync]);
 useEffect(()=>{document.documentElement.lang=lang;try{localStorage.setItem('echakra-language',lang)}catch{}},[lang]);
 useEffect(()=>{
  const interval=setInterval(()=>{if(navigator.onLine&&stateRef.current&&!syncLock.current)void getDrafts(stateRef.current.scope).then(async ds=>{if(ds.length)await sync();else await refresh()}).catch(()=>{})},25000);
  return()=>clearInterval(interval);
 },[refresh,sync]);
 useEffect(()=>{
  if(!lot)return;const o=selectedOffer(lot);
  setHandoverQty(String(lot.quantity));setFinalAmount(o?String(offerTotal(lot,o)):'');setHandoverPlace(lot.location);setOfferRate(String(categoryOf(lot.category).rate));
  setPaymentAmount(String(Math.max(0,(lot.handover?.amount||0)-lot.payments.reduce((n,p)=>n+p.amount,0))));
 },[lotId,lot?.version]);
 useEffect(()=>{
  const ctx=(document as any).modelContext;if(!ctx?.registerTool)return;const lifecycle=new AbortController();
  try{
   Promise.resolve(ctx.registerTool({name:'list_collector_lots',title:'List collector lots',description:'Read the lots currently visible in this collector prototype; makes no changes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async(input:unknown)=>{if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('No arguments are accepted');return {lots:stateRef.current?.lots.map(l=>({id:l.id,category:l.category,quantity:l.quantity,status:l.stage}))||[]}}},{signal:lifecycle.signal})).catch(()=>{});
  }catch{}
  return()=>lifecycle.abort();
 },[]);
 function locationHash(){return window.location.hash.replace(/^#\/?/,'').split('/')}
 function go(p:Page,id=''){setPage(p);setLotId(id);setError('');window.location.hash='/'+p+(id?'/'+id:'');window.scrollTo({top:0,behavior:'instant'})}
 function changeRole(next:Role,keepLot=false){setRole(next);sessionStorage.setItem('echakra-role',next);if(!keepLot)go('home')}
 async function perform(action:string,extra:Record<string,unknown>={}){
  if(!online){toast.error(t('onlineOnly'));return}
  if(!lot||busy)return;setBusy(true);setError('');
  try{await api({action,id:lot.id,version:lot.version,opId:crypto.randomUUID(),role,...extra});await refresh();toast.success(t('done'));setReportOpen(false)}
  catch(e){notifyError(e);await refresh().catch(()=>{})}finally{setBusy(false)}
 }
 async function createLot(){
  const qty=Number(quantity);
  if(!snapshot){toast.error(t('connectedFirst'));return}
  if(!category||!Number.isFinite(qty)||qty<=0||qty>100000||location.trim().length<2||(categoryOf(category).unit==='piece'&&!Number.isInteger(qty))){toast.error(t('required'));return}
  setBusy(true);setError('');
  try{
   const d:Draft={id:crypto.randomUUID(),category,quantity:qty,condition,location:location.trim(),notes:notes.trim(),createdAt:new Date().toISOString(),photo,audio};
   await putDraft(snapshot.scope,d);setDrafts(await getDrafts(snapshot.scope));toast.success(t('saved'));setCategory('');setQuantity('');setNotes('');setPhoto(undefined);setAudio(undefined);go('lots');await sync();
  }catch(e){notifyError(e)}finally{setBusy(false)}
 }
 async function attachPhoto(file?:File){if(!file)return;setBusy(true);try{setPhoto(await compressImage(file))}catch(e){notifyError(e)}finally{setBusy(false)}}
 async function toggleRecord(){
  if(recording){recordRef.current?.stop();clearTimeout(recordTimer.current);return}
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toast.error(lang==='en'?'Voice recording is unavailable in this browser.':lang==='hi'?'इस ब्राउज़र में रिकॉर्डिंग उपलब्ध नहीं है।':'या ब्राउझरमध्ये रेकॉर्डिंग उपलब्ध नाही.');return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(stream);const parts:BlobPart[]=[];
   rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());setAudio(new Blob(parts,{type:rec.mimeType}));setRecording(false)};rec.onerror=()=>{stream.getTracks().forEach(t=>t.stop());setRecording(false)};
   recordRef.current=rec;rec.start();setRecording(true);recordTimer.current=setTimeout(()=>{if(rec.state==='recording')rec.stop()},30000);
  }catch(e){notifyError(e)}
 }
 function speak(text:string){
  if(!('speechSynthesis' in window)){toast.info(t('audioUnavailable'));return}
  const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith(lang));
  if(!voice){toast.info(t('audioUnavailable'));return}
  window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==='hi'?'hi-IN':lang==='mr'?'mr-IN':'en-IN';u.voice=voice;u.rate=.9;window.speechSynthesis.speak(u);
 }
 function downloadReceipt(l:Lot){
  const o=selectedOffer(l);const buyer=BUYERS.find(b=>b.id===o?.buyerId);
  const text=['E-CHAKRA | PROTOTYPE RECEIPT','Sample buyer data. Not an EPR or recycling certificate.','',`Lot: ${l.id}`,`Material: ${categoryOf(l.category).name[lang]}`,`Collector quantity: ${l.quantity} ${categoryOf(l.category).unit}`,`Buyer: ${buyer?.name||'-'}`,`Original offer: ${o?money(offerTotal(l,o)):'-'}`,`Accepted quantity: ${l.handover?.quantity||'-'}`,`Agreed amount: ${money(l.handover?.amount||0)}`,`Location: ${l.handover?.location||l.location}`,`Handover reference: ${l.handover?.reference||'-'}`,`Handover confirmed: ${l.handover?.confirmedAt||'Not confirmed'}`,`Received: ${money(received(l))}`,`Pending: ${money(pending(l))}`,'',...l.payments.map(p=>`${p.createdAt} | ${p.method} | ${money(p.amount)} | ${p.confirmedAt?'Collector confirmed':'Receipt unconfirmed'} | ${p.reference||'-'}`),'',l.notes,'',...l.events.map(e=>`${e.at} | ${e.role} | ${e.action}`)].join('\n');
  saveDownload(text,'E-CHAKRA-'+l.id.slice(0,8)+'.txt');
 }
 function exportRecords(){
  const quote=(v:unknown)=>{const text=String(v??'');return '"'+(/^[=+@-]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"'};
  const rows=[['Lot ID','Material','Buyer','Unit','Received quantity','Final amount INR','Confirmed received INR','Pending INR','Status','Handover confirmed at'],...lots.filter(l=>l.handover).map(l=>[l.id,categoryOf(l.category).name.en,BUYERS.find(b=>b.id===selectedOffer(l)?.buyerId)?.name,categoryOf(l.category).unit,l.handover?.quantity,l.handover?.amount,received(l),pending(l),l.stage,l.handover?.confirmedAt])];
  saveDownload('\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'E-CHAKRA-records.csv','text/csv;charset=utf-8');
 }
 async function install(){if(installEvent){await installEvent.prompt();setInstallEvent(null)}else toast.info(t('installHint'),{duration:9000})}
 const badge=(l:Lot)=><span className={'tag '+(l.stage==='open'?'grey':l.stage==='disputed'?'red':['handover','accepted'].includes(l.stage)?'gold':'')}>{t(statusKey(l))}</span>;
 const LotRow=({l}:{l:Lot})=><button className="lot-row" onClick={()=>go('lot',l.id)}><span className="material-icon"><MaterialIcon id={l.category}/></span><span className="grow"><h3>{categoryOf(l.category).name[lang]}</h3><span className="meta">{l.quantity} {t(categoryOf(l.category).unit)} · {l.id.slice(0,6).toUpperCase()}</span></span><span className="end">{badge(l)}<small style={{display:'block',marginTop:4}}>{l.offers.length} {t('offers')}</small></span><ChevronRight size={16}/></button>;
 const Empty=()=> <div className="card empty"><span className="material-icon"><Package size={30}/></span><h3>{t('empty')}</h3><p>{t('emptyHint')}</p>{role==='collector'&&<button className="btn secondary" onClick={()=>go('create')}><Plus size={18}/>{t('create')}</button>}</div>;
 const sampleNote=<p className="sample-note"><Info size={15}/>{t('sampleNotice')}</p>;
 const nav=<>{NAV.map(n=><button key={n.id} className={page===n.id||(page==='lot'&&n.id==='lots')?'selected':''} onClick={()=>go(n.id)}><n.icon size={21}/><span>{t(n.label)}</span></button>)}</>;
 const Queue=()=>drafts.length?<div className="stack" style={{gap:10}}>{drafts.map(d=><div className="queue-row" key={d.id}><div className="row between"><div className="row"><CloudUpload size={20}/><strong>{categoryOf(d.category).name[lang]} · {d.quantity} {t(categoryOf(d.category).unit)}</strong></div><span className="tag gold">{t('queued')}</span></div><p>{d.error||t('offlineHint')}</p><button className="btn ghost" disabled={!online||syncing} onClick={()=>void sync()}><RefreshCw size={15}/>{t('sync')}</button></div>)}</div>:null;
 const statCards=<div className="stats"><div className="card stat"><span className="row"><IndianRupee size={18}/>{t('received')}</span><strong>{money(lots.reduce((s,l)=>s+received(l),0))}</strong></div><div className="card stat"><span className="row"><Clock size={18}/>{t('dues')}</span><strong>{money(lots.reduce((s,l)=>s+pending(l),0))}</strong></div></div>;
 const Header=({title,subtitle,back=false}:{title:string;subtitle?:string;back?:boolean})=><div className="page-heading"><div className="row">{back&&<button className="icon-btn" onClick={()=>go('lots')} aria-label={t('back')}><ArrowLeft size={20}/></button>}<div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></div>{!back&&<span className={'connection '+(!online?'is-offline':'')}>{online?<Wifi size={15}/>:<WifiOff size={15}/>}<span>{syncing?t('syncing'):t(online?'online':'offline')}</span></span>}</div>;

 return <><Toaster position="top-center" richColors closeButton/><header className="app-header"><button className="brand" onClick={()=>go('home')} style={{border:0,background:'none',textAlign:'left',padding:0}}><span className="brand-mark"><Recycle size={25}/></span><span><strong>E-CHAKRA</strong><small>{t(role)} · {t('demo')}</small></span></button><div className="header-tools"><span className="tag grey desktop-only">SIH 26229</span><NativeSelect aria-label={t('language')} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="en">English</option></NativeSelect><button className="profile-button" aria-label={t('settings')} onClick={()=>{setProfile({...snapshot?.profile||profile,language:lang});go('settings')}}><User size={20}/></button></div></header>
 <div className="app-layout"><aside className="desktop-nav"><nav className="stack" style={{gap:6}}>{nav}</nav><div className="nav-footer"><button onClick={()=>void install()}><Download size={19}/>{t('install')}</button><button onClick={()=>changeRole(role==='collector'?'recycler':'collector')}><Store size={19}/>{t(role==='collector'?'switchBuyer':'switchCollector')}</button></div></aside>
 <main className="main-content">
 {error&&<div className="error" role="alert" style={{marginBottom:18}}><div className="row between"><p>{error}</p><button className="icon-btn" aria-label={t('close')} onClick={()=>setError('')}>×</button></div>{!snapshot&&<button className="btn secondary" onClick={()=>{setLoading(true);void refresh().then(()=>setError('')).catch(notifyError).finally(()=>setLoading(false))}}>{t('retry')}</button>}</div>}
 {loading&&!snapshot?<div className="card stack"><h1>E-CHAKRA</h1><p>{t('loading')}</p></div>:<>
 {page==='home'&&<div className="stack"><Header title={role==='collector'?t('homeIntro'):t('buyerWorkspace')} subtitle={role==='collector'?(t('greeting')+(snapshot?.profile.name?', '+snapshot.profile.name:'')+' · '+(snapshot?.profile.location||location)):t('buyerIntro')}/>
 {role==='recycler'&&<div className="recycler-banner">{t('demoLimits')}</div>}
 {role==='collector'&&<div className="capture-card"><div className="capture-icon"><Camera size={31}/></div><div className="grow"><h2>{t('create')}</h2><p>{t('createHint')}</p><button className="btn" onClick={()=>go('create')} disabled={!snapshot}><Plus size={20}/>{t('create')}</button></div></div>}
 {statCards}<Queue/>
 <section><div className="section-head"><h2>{t('recent')}</h2><button className="btn ghost" onClick={()=>go('lots')}>{t('all')}<ChevronRight size={17}/></button></div>{lots.length?<div className="lot-list">{lots.slice(0,4).map(l=><LotRow l={l} key={l.id}/>)}</div>:<Empty/>}</section>
 <div className="soft-panel"><WifiOff size={24}/><div><h3>{t('saveOffline')}</h3><p>{t('offlineHint')}</p></div></div>
 <div className="row between wrap"><button className="demo-switch" onClick={()=>changeRole(role==='collector'?'recycler':'collector')}><Store size={16}/>{t(role==='collector'?'switchBuyer':'switchCollector')}</button><button className="btn ghost" onClick={()=>void install()}><Download size={17}/>{t('install')}</button></div>{sampleNote}</div>}
 {page==='lots'&&<div className="stack"><Header title={role==='recycler'?t('buyerWorkspace'):t('lots')}/><div className="toolbar"><div className="searchbox"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('search')} aria-label={t('search')}/></div><NativeSelect value={filter} onChange={e=>setFilter(e.target.value)} aria-label={t('status')}><option value="all">{t('filterAll')}</option>{(['open','accepted','handover','received','paid','disputed'] as const).map(s=><option value={s} key={s}>{t(s==='received'?'receivedStage':s)}</option>)}</NativeSelect><button className="icon-btn" disabled={!online} onClick={()=>void refresh().catch(notifyError)} aria-label={t('refresh')}><RefreshCw size={19}/></button></div><Queue/>{lots.length?<div className="lot-list">{lots.filter(l=>(filter==='all'||l.stage===filter)&&(categoryOf(l.category).name[lang]+' '+l.id).toLowerCase().includes(query.toLowerCase())).map(l=><LotRow key={l.id} l={l}/>)}{!lots.some(l=>(filter==='all'||l.stage===filter)&&(categoryOf(l.category).name[lang]+' '+l.id).toLowerCase().includes(query.toLowerCase()))&&<p className="card">{t('emptyFilter')}</p>}</div>:<Empty/>}{role==='collector'&&<button className="btn primary" onClick={()=>go('create')}><Plus size={20}/>{t('create')}</button>}{sampleNote}</div>}
 {page==='create'&&<div className="stack"><Header title={t('create')} back/><form className="card stack" onSubmit={e=>{e.preventDefault();void createLot()}}>
 <div className="field"><label className="field-label">{t('photo')}</label><label className="photo-upload">{photo?<BlobPhoto blob={photo} alt={t('photo')}/>:<ImagePlus size={36}/>}<strong>{t(photo?'changePhoto':'addPhoto')}</strong><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={t('photo')} onChange={e=>void attachPhoto(e.target.files?.[0])}/></label></div>
 <div className="field"><span className="field-label">{t('material')}</span><div className="material-grid">{CATEGORIES.map(c=><button type="button" className={'material-choice '+(category===c.id?'chosen':'')} onClick={()=>setCategory(c.id)} key={c.id} aria-pressed={category===c.id}><MaterialIcon id={c.id}/><span>{c.name[lang]}</span></button>)}</div><small>{t('manual')}</small></div>
 <div className="grid-2"><Field label={t('quantity')+(category?' ('+t(categoryOf(category).unit)+')':'')}><input required inputMode="decimal" type="number" min={category&&categoryOf(category).unit==='piece'?1:.01} max="100000" step={category&&categoryOf(category).unit==='piece'?'1':'.01'} placeholder="0" value={quantity} onChange={e=>setQuantity(e.target.value)}/></Field><Field label={t('condition')}><NativeSelect value={condition} onChange={e=>setCondition(e.target.value as 'scrap'|'reusable')}><option value="scrap">{t('scrap')}</option><option value="reusable">{t('reusable')}</option></NativeSelect></Field></div>
 <Field label={t('location')}><input required minLength={2} maxLength={150} value={location} onChange={e=>setLocation(e.target.value)}/></Field>
 <Field label={t('notes')}><textarea maxLength={500} placeholder={t('notesHint')} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
 <div><button type="button" className={'btn secondary '+(recording?'voice-recording':'')} onClick={()=>void toggleRecord()}>{recording?<Square size={18}/>:<Mic size={18}/>} {t(recording?'stop':'voice')} <small>30s</small></button>{audio&&<><AttachmentAudio blob={audio}/><button type="button" className="btn ghost" onClick={()=>setAudio(undefined)}><Trash2 size={16}/>{t('remove')}</button></>}</div>
 {category&&Number(quantity)>0&&<div className="estimate"><div className="row between"><span>{t('estimate')}</span><strong>{money(Number(quantity)*categoryOf(category).rate)}</strong></div><p>{t('estimateHint')}</p></div>}
 <div className="soft-panel"><WifiOff size={20}/><p>{t('offlineHint')}</p></div><button className="btn primary full" disabled={busy||recording||!snapshot} type="submit"><CloudUpload size={21}/>{t(busy?'saving':'save')}</button></form></div>}
 {page==='lot'&&!lot&&<div className="card stack"><Header title={t('lotDetail')} back/><p>{t('queued')}</p><Queue/></div>}
 {page==='lot'&&lot&&<div className="stack"><Header title={t('lotDetail')} back/>
 <div className="card"><div className="detail-top">{lot.photoId?<BlobPhoto blob={media[lot.photoId]} src={'/api/media?id='+lot.photoId} alt={t('photo')}/>:<span className="material-icon"><MaterialIcon id={lot.category} size={36}/></span>}<div className="grow"><h2>{categoryOf(lot.category).name[lang]}</h2><p className="caption">{lot.quantity} {t(categoryOf(lot.category).unit)} · {t(lot.condition)}</p><div style={{marginTop:7}}>{badge(lot)}</div></div></div><dl className="detail-meta"><div><dt>{t('reference')}</dt><dd>{lot.id.slice(0,8).toUpperCase()}</dd></div><div><dt>{t('location')}</dt><dd>{lot.location}</dd></div><div><dt>{t('created')}</dt><dd>{formatDate(lot.createdAt,lang)}</dd></div><div><dt>{t('estimate')}</dt><dd>{money(lot.quantity*categoryOf(lot.category).rate)} <span className="meta">{t('sample')}</span></dd></div></dl>{lot.notes&&<p className="caption" style={{marginTop:16,whiteSpace:'pre-wrap'}}>{lot.notes}</p>}{lot.audioId&&<AttachmentAudio blob={media[lot.audioId]} src={'/api/media?id='+lot.audioId}/>}</div>
 <div className="row between wrap"><span className="tag grey">{t(role)} · {t('demo')}</span><button className="demo-switch" onClick={()=>changeRole(role==='collector'?'recycler':'collector',true)}><Store size={16}/>{t(role==='collector'?'switchBuyer':'switchCollector')}</button></div>
 {lot.stage==='open'&&<><div className="section-head"><h2>{t('offers')}</h2><small>{lot.offers.length} {t('offers')}</small></div>{lot.offers.length===0&&<div className="card stack"><h3>{t('noOffers')}</h3><p className="caption">{t('demoOffersHint')}</p><button className="btn secondary" disabled={busy||!online} onClick={()=>void perform('sample_offers')}><Plus size={18}/>{t('demoOffers')}</button></div>}
 {lot.offers.slice().sort((a,b)=>offerTotal(lot,b)-offerTotal(lot,a)).map((o,i)=>{const b=BUYERS.find(b=>b.id===o.buyerId)!;const expired=Date.parse(o.expiresAt)<Date.now();return <div className={'offer-card '+(!i?'best':'')} key={o.id}><div className="row between"><div><h3>{b.name}</h3><small>{b.kind==='repair'?t('reusable'):t('recycler')}</small></div><span className="material-icon"><Store size={24}/></span></div><p className="sample-note" style={{marginTop:8}}>{t('sampleBuyer')}</p><div className="breakdown"><span>{t('rate')}</span><span>{money(o.rate)} / {t(categoryOf(lot.category).unit)}</span></div><div className="breakdown"><span>{t('transport')}</span><span>{money(o.charge)}</span></div><div className="breakdown"><span>{o.pickup?t('pickup'):t('dropoff')}</span><span>{b.distance} km · {t('distance')}</span></div><div className="breakdown total"><span>{t('net')}</span><span className="offer-total">{money(offerTotal(lot,o))}</span></div>{role==='collector'&&<button className="btn primary full" disabled={busy||!online||expired} onClick={()=>void perform('accept_offer',{offerId:o.id})}>{t(expired?'expired':'choose')}</button>}</div>})}
 {role==='recycler'&&<form className="card stack" onSubmit={e=>{e.preventDefault();void perform('create_offer',{buyerId,rate:Number(offerRate),charge:Number(offerCharge),pickup})}}><h2>{t('submitOffer')}</h2><Field label={t('buyer')}><NativeSelect value={buyerId} onChange={e=>setBuyerId(e.target.value)}>{BUYERS.filter(b=>validBuyer(lot,b.id)).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</NativeSelect></Field><div className="grid-2"><Field label={t('rate')+' / '+t(categoryOf(lot.category).unit)}><input required type="number" min=".01" step=".01" max="1000000" value={offerRate} onChange={e=>setOfferRate(e.target.value)}/></Field><Field label={t('transport')}><input required type="number" min="0" step=".01" value={offerCharge} onChange={e=>setOfferCharge(e.target.value)}/></Field></div><Field label={t('pickup')}><NativeSelect value={pickup?'pickup':'dropoff'} onChange={e=>setPickup(e.target.value==='pickup')}><option value="pickup">{t('pickup')}</option><option value="dropoff">{t('dropoff')}</option></NativeSelect></Field><button className="btn primary" disabled={busy||!online}>{t('submitOffer')}</button></form>}</>}
 {lot.acceptedOfferId&&<div className="card"><div className="row"><span className="material-icon"><Store/></span><div><span className="caption">{t('chosen')}</span><h3>{BUYERS.find(b=>b.id===selectedOffer(lot)?.buyerId)?.name}</h3></div></div><div className="breakdown total"><span>{t('net')}</span><span>{money(offerTotal(lot,selectedOffer(lot)!))}</span></div><p className="caption" style={{marginTop:10}}>{t('transportTerms')}</p></div>}
 {lot.stage==='accepted'&&(role==='collector'?<div className="soft-panel"><ClipboardCheck size={24}/><div><h3>{t('handover')}</h3><p>{t('handoverHint')}</p><button className="btn ghost" onClick={()=>changeRole('recycler',true)}>{t('switchBuyer')}</button></div></div>:<form className="card stack" onSubmit={e=>{e.preventDefault();void perform('propose_handover',{quantity:Number(handoverQty),amount:Number(finalAmount),location:handoverPlace})}}><h2>{t('propose')}</h2><div className="grid-2"><Field label={t('actualQty')+' ('+t(categoryOf(lot.category).unit)+')'}><input required type="number" min=".01" step={categoryOf(lot.category).unit==='piece'?'1':'.01'} max="100000" value={handoverQty} onChange={e=>setHandoverQty(e.target.value)}/></Field><Field label={t('finalAmount')}><input required type="number" min=".01" step=".01" max="100000000" value={finalAmount} onChange={e=>setFinalAmount(e.target.value)}/></Field></div><Field label={t('handoverLocation')}><input required minLength={2} maxLength={150} value={handoverPlace} onChange={e=>setHandoverPlace(e.target.value)}/></Field><button className="btn primary" disabled={busy||!online}>{t('propose')}</button></form>)}
 {lot.handover&&<div className="card stack"><div className="row"><ClipboardCheck size={23}/><h2>{t('reviewHandover')}</h2></div><div className="receipt-reference">{lot.handover.reference}</div><div className="breakdown"><span>{t('actualQty')}</span><strong>{lot.handover.quantity} {t(categoryOf(lot.category).unit)}</strong></div><div className="breakdown"><span>{t('finalAmount')}</span><strong>{money(lot.handover.amount)}</strong></div><div className="breakdown"><span>{t('handoverLocation')}</span><span>{lot.handover.location}</span></div>{lot.handover.confirmedAt?<div className="success-strip row"><CheckCircle2 size={18}/>{t('receivedStage')}</div>:<><p className="caption">{t('handoverWarning')}</p>{role==='collector'&&lot.stage==='handover'?<button className="btn primary" disabled={busy||!online} onClick={()=>void perform('confirm_handover')}><CheckCircle2 size={20}/>{t('confirmHandover')}</button>:<button className="btn secondary" onClick={()=>changeRole('collector',true)}>{t('switchCollector')}</button>}</>}</div>}
 {lot.handover?.confirmedAt&&<div className="card stack"><h2>{t('payments')}</h2><div className="stats"><div><span className="caption">{t('received')}</span><h2 className="money-received">{money(received(lot))}</h2></div><div><span className="caption">{t('dues')}</span><h2 className="money-due">{money(pending(lot))}</h2></div></div>{lot.payments.map(p=><div className="payment-item" key={p.id}><div className="row between"><strong>{money(p.amount)}</strong><span className={'tag '+(p.confirmedAt?'':'gold')}>{t(p.confirmedAt?'confirmed':'pendingConfirm')}</span></div><small>{t(p.method)} · {formatDate(p.createdAt,lang)} {p.reference&&' · '+p.reference}</small>{role==='collector'&&!p.confirmedAt&&lot.stage==='received'&&<><p className="caption" style={{marginTop:9}}>{t('paymentHint')}</p><button className="btn primary full" style={{marginTop:12}} disabled={busy||!online} onClick={()=>void perform('confirm_payment',{paymentId:p.id})}>{t('confirmPayment')}</button></>}</div>)}
 {role==='recycler'&&lot.stage==='received'&&lot.payments.reduce((s,p)=>s+p.amount,0)<lot.handover.amount&&<form className="stack" onSubmit={e=>{e.preventDefault();void perform('record_payment',{amount:Number(paymentAmount),method:paymentMethod,reference:paymentReference})}}><h3>{t('recordPayment')}</h3><div className="grid-2"><Field label={t('amount')}><input required type="number" min=".01" step=".01" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/></Field><Field label={t('method')}><NativeSelect value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as 'cash'|'upi')}><option value="cash">{t('cash')}</option><option value="upi">{t('upi')}</option></NativeSelect></Field></div>{paymentMethod==='upi'&&<Field label={t('paymentRef')}><input required minLength={4} maxLength={100} value={paymentReference} onChange={e=>setPaymentReference(e.target.value)}/></Field>}<p className="caption">{t('paymentHint')}</p><button className="btn primary" disabled={busy||!online}>{t('recordPayment')}</button></form>}
 {role==='collector'&&lot.stage==='received'&&lot.payments.length===0&&<button className="btn secondary" onClick={()=>changeRole('recycler',true)}>{t('switchBuyer')}</button>}
 <button className="btn secondary full" onClick={()=>downloadReceipt(lot)}><Download size={18}/>{t('receipt')}</button></div>}
 {lot.stage==='disputed'&&<div className="issue-panel"><h3>{t('disputed')}</h3><p>{t('issueNotice')}</p><button className="btn ghost" onClick={()=>downloadReceipt(lot)}>{t('receipt')}</button></div>}
 <div className="card"><h2>{t('timeline')}</h2><div className="timeline">{lot.events.map((e,i)=><div className="timeline-item" key={i}><span className="timeline-dot"/><div><strong>{t(EVENT_NAMES[e.action]||'done')}</strong><small>{t(e.role)} · {formatDate(e.at,lang)}</small></div></div>)}</div></div>
 {role==='collector'&&['accepted','handover','received'].includes(lot.stage)&&<button className="btn danger" onClick={()=>setReportOpen(true)}><AlertTriangle size={18}/>{t('report')}</button>}
 {sampleNote}</div>}
 {page==='prices'&&<div className="stack"><Header title={t('pricesTitle')} subtitle={t('pricesHint')}/><div className="row between wrap"><span className="row caption"><MapPin size={17}/>{snapshot?.profile.location||location}</span><span className="tag grey">{t('sample')}</span></div><div className="price-grid">{CATEGORIES.map(c=><div className="card price-card" key={c.id}><div className="row between"><span className="material-icon"><MaterialIcon id={c.id}/></span><button className="icon-btn" onClick={()=>speak(c.name[lang]+' '+c.rate+' '+(lang==='en'?'rupees per ':lang==='hi'?'रुपये प्रति ':'रुपये प्रति ')+t(c.unit))} aria-label={t('listen')+' '+c.name[lang]}><Volume2 size={18}/></button></div><h3>{c.name[lang]}</h3><strong>{money(c.rate)} <small>/ {t(c.unit)}</small></strong><small>{t('referenceDate')}</small></div>)}</div>{sampleNote}</div>}
 {page==='records'&&<div className="stack"><Header title={t('recordsTitle')} subtitle={t('recordsHint')}/>{statCards}{lots.some(l=>l.handover?.confirmedAt)?<><div className="card" style={{padding:0}}>{lots.filter(l=>l.handover?.confirmedAt).map(l=><div className="history-card" key={l.id}><div className="row between"><div><h3>{categoryOf(l.category).name[lang]}</h3><small>{l.handover?.reference}</small></div>{badge(l)}</div><div className="grid-2" style={{marginTop:15}}><div><small>{t('received')}</small><h3 className="money-received">{money(received(l))}</h3></div><div><small>{t('dues')}</small><h3 className="money-due">{money(pending(l))}</h3></div></div><div className="row between"><button className="btn ghost" onClick={()=>go('lot',l.id)}>{t('lotDetail')}<ChevronRight size={16}/></button><button className="icon-btn" aria-label={t('receipt')} onClick={()=>downloadReceipt(l)}><Download size={18}/></button></div></div>)}</div><button className="btn secondary" onClick={exportRecords}><Download size={18}/>{t('export')}</button></>:<div className="card empty"><span className="material-icon"><ReceiptText size={28}/></span><p>{t('noRecords')}</p></div>}{sampleNote}</div>}
 {page==='help'&&<div className="stack"><Header title={t('helpTitle')}/>{([{icon:Battery,title:'batteryTitle',text:'batteryText'},{icon:MonitorOff,title:'crtTitle',text:'crtText'},{icon:Cable,title:'cableTitle',text:'cableText'}] as const).map(s=><div className="card safety-card" key={s.title}><span className="material-icon"><s.icon size={25}/></span><div><h2>{t(s.title)}</h2><p>{t(s.text)}</p><button className="btn ghost" onClick={()=>speak(t(s.text))}><Volume2 size={18}/>{t('listen')}</button></div></div>)}
 <div className="card stack"><h2>{t('demoGuide')}</h2><p>{t('demoSteps')}</p><button className="btn secondary" onClick={()=>changeRole(role==='collector'?'recycler':'collector')}><Store size={18}/>{t(role==='collector'?'switchBuyer':'switchCollector')}</button><p className="caption">{t('demoLimits')}</p></div><div className="card stack"><h3>{t('install')}</h3><p>{t('installHint')}</p><button className="btn secondary" onClick={()=>void install()}><Download size={18}/>{t('install')}</button></div></div>}
 {page==='settings'&&<div className="stack"><Header title={t('settings')}/><form className="card stack" onSubmit={e=>{e.preventDefault();if(!online){toast.error(t('onlineOnly'));return}setBusy(true);void api({action:'profile',profile:{...profile,language:lang}}).then(()=>refresh()).then(()=>{setLocation(profile.location);toast.success(t('savedProfile'))}).catch(notifyError).finally(()=>setBusy(false))}}><Field label={t('name')}><input maxLength={60} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></Field><Field label={t('location')}><input minLength={2} maxLength={150} required value={profile.location} onChange={e=>setProfile({...profile,location:e.target.value})}/></Field><Field label={t('language')}><NativeSelect value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="en">English</option></NativeSelect></Field><button className="btn primary" disabled={busy||!online}>{t('saveProfile')}</button></form><button className="btn secondary" onClick={()=>changeRole(role==='collector'?'recycler':'collector')}><Store size={19}/>{t(role==='collector'?'switchBuyer':'switchCollector')}</button><button className="btn secondary" onClick={()=>void install()}><Download size={18}/>{t('install')}</button><p className="caption">{t('demoLimits')}</p></div>}
 </>}
 </main></div><nav className="bottom-nav" aria-label="Main navigation">{nav}</nav>
 <Dialog open={reportOpen} onOpenChange={setReportOpen}><DialogContent><DialogHeader><DialogTitle>{t('report')}</DialogTitle><DialogDescription>{t('reason')}</DialogDescription></DialogHeader><form className="stack" onSubmit={e=>{e.preventDefault();void perform('dispute',{reason:issue})}}><Field label={t('reason')}><textarea required minLength={5} maxLength={200} value={issue} onChange={e=>setIssue(e.target.value)}/></Field><button className="btn danger" disabled={busy||!online}>{t('report')}</button></form></DialogContent></Dialog>
 </>;
}

