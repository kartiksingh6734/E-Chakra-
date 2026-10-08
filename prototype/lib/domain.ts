export type Lang='hi'|'mr'|'en';
export type Role='collector'|'recycler';
export type Stage='open'|'accepted'|'handover'|'received'|'paid'|'disputed';
export type Material='pcb'|'cables'|'lcd'|'crt'|'batteries'|'motors'|'magnets'|'plastics';
export const CATEGORIES:{id:Material;name:Record<Lang,string>;unit:'kg'|'piece';rate:number;icon:string}[]=[
{id:'pcb',name:{hi:'सर्किट बोर्ड',mr:'सर्किट बोर्ड',en:'Circuit boards'},unit:'kg',rate:350,icon:'cpu'},
{id:'cables',name:{hi:'तार और केबल',mr:'तारा व केबल',en:'Wires & cables'},unit:'kg',rate:180,icon:'cable'},
{id:'lcd',name:{hi:'LCD स्क्रीन',mr:'LCD स्क्रीन',en:'LCD panels'},unit:'piece',rate:200,icon:'monitor'},
{id:'crt',name:{hi:'पुराना CRT टीवी',mr:'जुना CRT टीव्ही',en:'CRT televisions'},unit:'kg',rate:20,icon:'tv'},
{id:'batteries',name:{hi:'बैटरियां',mr:'बॅटऱ्या',en:'Batteries'},unit:'kg',rate:250,icon:'battery'},
{id:'motors',name:{hi:'मोटर',mr:'मोटर',en:'Motors'},unit:'piece',rate:70,icon:'cog'},
{id:'magnets',name:{hi:'चुंबक वाले पुर्जे',mr:'चुंबक असलेले भाग',en:'Magnet assemblies'},unit:'kg',rate:90,icon:'magnet'},
{id:'plastics',name:{hi:'मिश्रित प्लास्टिक',mr:'मिश्र प्लास्टिक',en:'Mixed plastics'},unit:'kg',rate:12,icon:'recycle'}
];
export const BUYERS=[
{id:'recycler-a',name:'Demo Recycler A',kind:'recycler',distance:4.2,pickup:true,multiplier:1,charge:0},
{id:'recycler-b',name:'Demo Recycler B',kind:'recycler',distance:7.8,pickup:false,multiplier:1.1,charge:80},
{id:'repair-a',name:'Demo Repair Shop',kind:'repair',distance:2.4,pickup:false,multiplier:1.25,charge:30}
] as const;
export interface Offer{id:string;buyerId:string;rate:number;charge:number;pickup:boolean;expiresAt:string;createdAt:string}
export interface Payment{id:string;amount:number;method:'cash'|'upi';reference:string;createdAt:string;confirmedAt?:string}
export interface Handover{quantity:number;amount:number;location:string;reference:string;createdAt:string;confirmedAt?:string}
export interface Lot{id:string;category:Material;quantity:number;condition:'scrap'|'reusable';location:string;notes:string;photoId?:string;audioId?:string;createdAt:string;updatedAt:string;stage:Stage;offers:Offer[];acceptedOfferId?:string;handover?:Handover;payments:Payment[];events:{at:string;action:string;role:Role}[];operations:string[];version:number}
export interface Draft{id:string;category:Material;quantity:number;condition:'scrap'|'reusable';location:string;notes:string;createdAt:string;photo?:Blob;audio?:Blob;photoId?:string;audioId?:string;error?:string}
export interface Profile{name:string;location:string;language:Lang}
export const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
export const categoryOf=(id:Material)=>CATEGORIES.find(c=>c.id===id)!;
export const selectedOffer=(lot:Lot)=>lot.offers.find(o=>o.id===lot.acceptedOfferId);
export const offerTotal=(lot:Pick<Lot,'quantity'>,o:Offer)=>Math.max(0,Math.round((lot.quantity*o.rate-o.charge)*100)/100);
export const received=(lot:Lot)=>lot.payments.filter(p=>p.confirmedAt).reduce((s,p)=>s+p.amount,0);
export const pending=(lot:Lot)=>['received','paid','disputed'].includes(lot.stage)&&lot.handover?.confirmedAt?Math.max(0,Math.round((lot.handover.amount-received(lot))*100)/100):0;
export function validBuyer(lot:Pick<Lot,'category'|'condition'>,buyerId:string){const b=BUYERS.find(b=>b.id===buyerId);return !!b&&(b.kind==='recycler'||(lot.condition==='reusable'&&['lcd','motors','pcb'].includes(lot.category)))}
export class DomainError extends Error{constructor(message:string,public status=400){super(message)}}
const requireValue=(v:unknown,message:string)=>{if(!v)throw new DomainError(message)};
export function mutateLot(original:Lot,input:Record<string,unknown>,now=new Date()):Lot{
 const lot:Lot=structuredClone(original);const action=String(input.action);const role=input.role as Role;
 const opId=String(input.opId||'');requireValue(/^[\w-]{8,80}$/.test(opId),'Invalid operation reference');
 if(lot.operations.includes(opId))return lot;
 requireValue(role==='collector'||role==='recycler','Select a valid role');
 if(Number(input.version)!==lot.version)throw new DomainError('This lot changed. Refresh and try again.',409);
 const at=now.toISOString();
 const number=(value:unknown,max:number)=>{const n=Number(value);requireValue(Number.isFinite(n)&&n>0&&n<=max,'Enter a valid positive amount or quantity');return n};
 const text=(value:unknown,max=200)=>String(value||'').trim().slice(0,max);
 switch(action){
 case 'sample_offers':{
 requireValue(lot.stage==='open','Offers are already closed');requireValue(lot.offers.length===0,'Offers already exist');
 lot.offers=BUYERS.filter(b=>validBuyer(lot,b.id)&&Math.round(categoryOf(lot.category).rate*b.multiplier)*lot.quantity>b.charge).map(b=>({id:crypto.randomUUID(),buyerId:b.id,rate:Math.round(categoryOf(lot.category).rate*b.multiplier),charge:b.charge,pickup:b.pickup,createdAt:at,expiresAt:new Date(now.getTime()+86400000*3).toISOString()}));break}
 case 'create_offer':{
 requireValue(role==='recycler','Switch to the recycler demo role');requireValue(lot.stage==='open','This lot no longer accepts offers');
 const buyerId=String(input.buyerId);requireValue(validBuyer(lot,buyerId),'This buyer does not accept this material for this purpose');
 const rate=number(input.rate,1000000);const charge=Number(input.charge||0);requireValue(Number.isFinite(charge)&&charge>=0&&charge<=rate*lot.quantity,'Invalid transport charge');
 lot.offers=lot.offers.filter(o=>o.buyerId!==buyerId);lot.offers.push({id:crypto.randomUUID(),buyerId,rate,charge,pickup:!!input.pickup,createdAt:at,expiresAt:new Date(now.getTime()+86400000*3).toISOString()});break}
 case 'accept_offer':{
 requireValue(role==='collector','Only the collector can accept an offer');requireValue(lot.stage==='open','This lot already has an accepted offer');
 const o=lot.offers.find(o=>o.id===input.offerId);requireValue(o,'Offer not found');requireValue(Date.parse(o!.expiresAt)>now.getTime(),'This offer has expired');
 lot.acceptedOfferId=o!.id;lot.stage='accepted';break}
 case 'propose_handover':{
 requireValue(role==='recycler','The recycler records the received weight and amount');requireValue(lot.stage==='accepted','Accept an offer before handover');
 const quantity=number(input.quantity,100000);if(categoryOf(lot.category).unit==='piece')requireValue(Number.isInteger(quantity),'Enter a whole number of pieces');
 const amount=Math.round(number(input.amount,100000000)*100)/100;requireValue(amount>=.01,'Amount must be at least 0.01');const location=text(input.location);requireValue(location.length>=2,'Enter the handover location');
 lot.handover={quantity,amount,location,reference:'EC-'+lot.id.slice(0,8).toUpperCase(),createdAt:at};lot.stage='handover';break}
 case 'confirm_handover':requireValue(role==='collector','The collector confirms the handover');requireValue(lot.stage==='handover'&&lot.handover,'No handover is ready');lot.handover!.confirmedAt=at;lot.stage='received';break;
 case 'record_payment':{
 requireValue(role==='recycler','The recycler records the payment');requireValue(lot.stage==='received','Confirm handover before recording payment');
 const amount=Math.round(number(input.amount,100000000)*100)/100;requireValue(amount>=.01,'Amount must be at least 0.01');const remaining=lot.handover!.amount-lot.payments.reduce((s,p)=>s+p.amount,0);
 requireValue(amount<=remaining+.001,'Payment exceeds the unrecorded balance');const method=input.method;requireValue(method==='cash'||method==='upi','Choose cash or UPI');
 const reference=text(input.reference,100);if(method==='upi')requireValue(reference.length>=4,'Enter the external UPI reference');
 lot.payments.push({id:crypto.randomUUID(),amount,method:method as 'cash'|'upi',reference,createdAt:at});break}
 case 'confirm_payment':{
 requireValue(role==='collector','The collector confirms money received');requireValue(lot.stage==='received','Confirm handover first');
 const p=lot.payments.find(p=>p.id===input.paymentId);requireValue(p&&!p.confirmedAt,'Payment already confirmed or missing');p!.confirmedAt=at;if(pending(lot)<=.001)lot.stage='paid';break}
 case 'dispute':requireValue(role==='collector'&&['accepted','handover','received'].includes(lot.stage),'This lot cannot be disputed now');requireValue(text(input.reason).length>=5,'Describe the issue in at least 5 characters');lot.stage='disputed';lot.notes+=(lot.notes?'\n':'')+'Issue: '+text(input.reason);break;
 default:throw new DomainError('Unknown action')
 }
 lot.operations.push(opId);lot.operations=lot.operations.slice(-256);lot.events.push({at,action,role});lot.updatedAt=at;lot.version++;return lot;
}
