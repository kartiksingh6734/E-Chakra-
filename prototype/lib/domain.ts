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
const paise = (rupees: number) => Math.round(rupees * 100);

export function offerTotal(lot: Pick<Lot, 'quantity'>, offer: Offer): number {
 const hundredths = Math.round(lot.quantity * 100);
 const ratePaise = paise(offer.rate);
 // Quantities entered by the collector form and whole-paise rates can be
 // multiplied exactly before rounding the quoted price to the nearest paisa.
 if (hundredths / 100 === lot.quantity && ratePaise / 100 === offer.rate &&
     paise(offer.charge) / 100 === offer.charge) {
  return Math.max(0, Math.round(hundredths * ratePaise / 100) - paise(offer.charge)) / 100;
 }
 // Older lots and API clients can contain higher-precision quantities or rates.
 return Math.max(0, Math.round((lot.quantity * offer.rate - offer.charge) * 100)) / 100;
}


function paymentTotal(lot: Lot, confirmedOnly: boolean) {
 return lot.payments.reduce((sum, payment) =>
  sum + (!confirmedOnly || payment.confirmedAt ? paise(payment.amount) : 0), 0);
}

export const received = (lot: Lot) => paymentTotal(lot, true) / 100;
export const pending = (lot: Lot) => lot.handover?.confirmedAt
 ? Math.max(0, paise(lot.handover.amount) - paymentTotal(lot, true)) / 100 : 0;
export const unrecordedBalance = (lot: Lot) => lot.handover?.confirmedAt
 ? Math.max(0, paise(lot.handover.amount) - paymentTotal(lot, false)) / 100 : 0;
export function validBuyer(lot:Pick<Lot,'category'|'condition'>,buyerId:string){const b=BUYERS.find(b=>b.id===buyerId);return !!b&&(b.kind==='recycler'||(lot.condition==='reusable'&&['lcd','motors','pcb'].includes(lot.category)))}
export class DomainError extends Error{constructor(message:string,public status=400){super(message)}}
function requireValue(value: unknown, message: string): asserts value {
 if (!value) throw new DomainError(message);
}

function numeric(value: unknown, max: number, allowZero = false): number {
 const n = typeof value === 'string' && value.trim() ? Number(value) : value;
 requireValue(typeof n === 'number' && Number.isFinite(n) && n <= max &&
  (allowZero ? n >= 0 : n > 0), 'Enter a valid amount or quantity');
 return n;
}

function currency(value: unknown, max: number, allowZero = false): number {
 const n = numeric(value, max, allowZero);
 requireValue(paise(n) / 100 === n, 'Enter an amount in whole paise');
 return n;
}

function textField(value: unknown, min: number, max: number, message: string): string {
 requireValue(typeof value === 'string', message);
 const result = value.trim();
 requireValue(result.length >= min && result.length <= max, message);
 return result;
}

export function mutateLot(original: Lot, input: Record<string, unknown>, now = new Date()): Lot {
 const opId = input.opId;
 requireValue(typeof opId === 'string' && /^[\w-]{8,80}$/.test(opId), 'Invalid operation reference');
 if (original.operations.includes(opId)) return original;
 const role = input.role;
 requireValue(role === 'collector' || role === 'recycler', 'Select a valid role');
 const version = typeof input.version === 'string' ? Number(input.version) : input.version;
 if (version !== original.version) throw new DomainError('This lot changed. Refresh and try again.', 409);

 const lot = structuredClone(original);
 const at = now.toISOString();
 const action = input.action;
 switch (action) {
 case 'sample_offers': {
  requireValue(lot.stage === 'open', 'Offers are already closed');
  requireValue(lot.offers.length === 0, 'Offers already exist');
  lot.offers = BUYERS.filter(buyer => validBuyer(lot, buyer.id)).map(buyer => ({
   id: crypto.randomUUID(), buyerId: buyer.id,
   rate: Math.round(categoryOf(lot.category).rate * buyer.multiplier),
   charge: buyer.charge, pickup: buyer.pickup, createdAt: at,
   expiresAt: new Date(now.getTime() + 86400000 * 3).toISOString(),
  })).filter(offer => offerTotal(lot, offer) > 0);
  requireValue(lot.offers.length, 'No sample offer has a positive net amount for this quantity');
  break;
 }
 case 'create_offer': {
  requireValue(role === 'recycler', 'Switch to the recycler demo role');
  requireValue(lot.stage === 'open', 'This lot no longer accepts offers');
  const buyerId = input.buyerId;
  requireValue(typeof buyerId === 'string' && validBuyer(lot, buyerId),
   'This buyer does not accept this material for this purpose');
  const rate = currency(input.rate, 1000000);
  const charge = currency(input.charge === undefined ? 0 : input.charge, rate * lot.quantity, true);
  const pickup = input.pickup === undefined ? false : input.pickup;
  requireValue(typeof pickup === 'boolean', 'Choose pickup or dropoff');
  const offer: Offer = {id: crypto.randomUUID(), buyerId, rate, charge, pickup, createdAt: at,
   expiresAt: new Date(now.getTime() + 86400000 * 3).toISOString()};
  requireValue(offerTotal(lot, offer) > 0, 'The offer must have a positive net amount');
  lot.offers = [...lot.offers.filter(existing => existing.buyerId !== buyerId), offer];
  break;
 }
 case 'accept_offer': {
  requireValue(role === 'collector', 'Only the collector can accept an offer');
  requireValue(lot.stage === 'open', 'This lot already has an accepted offer');
  const offer = lot.offers.find(o => o.id === input.offerId);
  requireValue(offer, 'Offer not found');
  requireValue(Date.parse(offer.expiresAt) > now.getTime(), 'This offer has expired');
  requireValue(offerTotal(lot, offer) > 0, 'The offer must have a positive net amount');
  lot.acceptedOfferId = offer.id;
  lot.stage = 'accepted';
  break;
 }
 case 'propose_handover': {
  requireValue(role === 'recycler', 'The recycler records the received weight and amount');
  requireValue(lot.stage === 'accepted', 'Accept an offer before handover');
  const quantity = numeric(input.quantity, 100000);
  if (categoryOf(lot.category).unit === 'piece') {
   requireValue(Number.isInteger(quantity), 'Enter a whole number of pieces');
  }
  const amount = currency(input.amount, 100000000);
  const location = textField(input.location, 2, 200, 'Enter a handover location of 2 to 200 characters');
  lot.handover = {quantity, amount, location, reference: 'EC-' + lot.id.slice(0, 8).toUpperCase(), createdAt: at};
  lot.stage = 'handover';
  break;
 }
 case 'confirm_handover':
  requireValue(role === 'collector', 'The collector confirms the handover');
  requireValue(lot.stage === 'handover' && lot.handover, 'No handover is ready');
  lot.handover.confirmedAt = at;
  lot.stage = 'received';
  break;
 case 'record_payment': {
  requireValue(role === 'recycler', 'The recycler records the payment');
  requireValue(lot.stage === 'received', 'Confirm handover before recording payment');
  const amount = currency(input.amount, 100000000);
  requireValue(amount <= unrecordedBalance(lot), 'Payment exceeds the unrecorded balance');
  const method = input.method;
  requireValue(method === 'cash' || method === 'upi', 'Choose cash or UPI');
  const reference = textField(input.reference === undefined ? '' : input.reference,
   method === 'upi' ? 4 : 0, 100, 'Enter a valid payment reference (4 to 100 characters for UPI)');
  lot.payments.push({id: crypto.randomUUID(), amount, method, reference, createdAt: at});
  break;
 }
 case 'confirm_payment': {
  requireValue(role === 'collector', 'The collector confirms money received');
  requireValue(lot.stage === 'received', 'Confirm handover first');
  const payment = lot.payments.find(p => p.id === input.paymentId);
  requireValue(payment && !payment.confirmedAt, 'Payment already confirmed or missing');
  payment.confirmedAt = at;
  if (pending(lot) === 0) lot.stage = 'paid';
  break;
 }
 case 'dispute': {
  requireValue(role === 'collector' && ['accepted', 'handover', 'received'].includes(lot.stage),
   'This lot cannot be disputed now');
  const reason = textField(input.reason, 5, 200, 'Describe the issue in 5 to 200 characters');
  lot.stage = 'disputed';
  lot.notes += (lot.notes ? '\n' : '') + 'Issue: ' + reason;
  break;
 }
 default:
  throw new DomainError('Unknown action');
 }

 lot.operations.push(opId);
 lot.operations = lot.operations.slice(-256);
 lot.events.push({at, action, role});
 lot.updatedAt = at;
 lot.version++;
 return lot;
}
