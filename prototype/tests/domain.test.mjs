import test from 'node:test';
import assert from 'node:assert/strict';
import {mutateLot,pending,received,offerTotal,validBuyer} from '../lib/domain.ts';
const base=()=>({id:crypto.randomUUID(),category:'pcb',quantity:10,condition:'scrap',location:'Mayapuri, Delhi',notes:'',createdAt:'2026-10-08T10:00:00Z',updatedAt:'2026-10-08T10:00:00Z',stage:'open',offers:[],payments:[],events:[],operations:[],version:1});
function act(l,action,role='collector',extra={}){return mutateLot(l,{action,role,id:l.id,version:l.version,opId:crypto.randomUUID(),...extra})}
function handover(){let l=act(base(),'sample_offers');l=act(l,'accept_offer','collector',{offerId:l.offers[0].id});l=act(l,'propose_handover','recycler',{quantity:9.5,amount:3200,location:'Demo facility'});return l}
test('complete journey keeps handover, paid claims and confirmed cash separate',()=>{
 let l=handover();assert.equal(l.stage,'handover');assert.equal(received(l),0);assert.equal(pending(l),0);
 l=act(l,'confirm_handover');assert.equal(pending(l),3200);assert.equal(received(l),0);
 l=act(l,'record_payment','recycler',{amount:1200,method:'cash'});assert.equal(pending(l),3200);assert.equal(received(l),0);
 l=act(l,'confirm_payment','collector',{paymentId:l.payments[0].id});assert.equal(received(l),1200);assert.equal(pending(l),2000);assert.equal(l.stage,'received');
 l=act(l,'record_payment','recycler',{amount:2000,method:'upi',reference:'DEMO-UPI-1234'});
 l=act(l,'confirm_payment','collector',{paymentId:l.payments[1].id});assert.equal(l.stage,'paid');assert.equal(pending(l),0);assert.equal(received(l),3200);
});
test('retries do not duplicate payments',()=>{
 let l=act(handover(),'confirm_handover');const op={action:'record_payment',role:'recycler',version:l.version,opId:crypto.randomUUID(),amount:100,method:'cash'};
 l=mutateLot(l,op);const same=mutateLot(l,op);assert.equal(same.payments.length,1);assert.equal(same.version,l.version);
});
test('stale updates cannot overwrite confirmed state',()=>{
 const l=act(base(),'sample_offers');assert.throws(()=>mutateLot(l,{action:'accept_offer',role:'collector',version:1,opId:crypto.randomUUID(),offerId:l.offers[0].id}),/changed/);
});
test('money cannot be recorded before handover or beyond outstanding amount',()=>{
 assert.throws(()=>act(base(),'record_payment','recycler',{amount:5,method:'cash'}),/handover/);
 const l=act(handover(),'confirm_handover');assert.throws(()=>act(l,'record_payment','recycler',{amount:3200.01,method:'cash'}),/exceeds/);
 const paidClaim=act(l,'record_payment','recycler',{amount:3200,method:'cash'});
 assert.throws(()=>act(paidClaim,'record_payment','recycler',{amount:1,method:'cash'}),/exceeds/);
});
test('role and expiry rules are enforced by the domain',()=>{
 let l=act(base(),'sample_offers');assert.throws(()=>act(l,'accept_offer','recycler',{offerId:l.offers[0].id}),/collector/);
 l.offers[0].expiresAt='2020-01-01T00:00:00Z';assert.throws(()=>act(l,'accept_offer','collector',{offerId:l.offers[0].id}),/expired/);
 assert.throws(()=>act(handover(),'confirm_handover','recycler'),/collector/);
});
test('repair offers are limited to reusable supported material',()=>{
 assert.equal(validBuyer({category:'pcb',condition:'scrap'},'repair-a'),false);
 assert.equal(validBuyer({category:'batteries',condition:'reusable'},'repair-a'),false);
 assert.equal(validBuyer({category:'lcd',condition:'reusable'},'repair-a'),true);
});
test('piece quantities and invalid amounts are rejected',()=>{
 let l={...base(),category:'lcd',quantity:2};l=act(l,'sample_offers');l=act(l,'accept_offer','collector',{offerId:l.offers[0].id});
 assert.throws(()=>act(l,'propose_handover','recycler',{quantity:1.5,amount:10,location:'Delhi'}),/whole/);
 const confirmed=act(handover(),'confirm_handover');
 for(const amount of [-10,NaN,Infinity,0,.001])assert.throws(()=>act(confirmed,'record_payment','recycler',{amount,method:'cash'}));
});
test('transport deductions determine net proceeds and nonpositive sample offers are excluded',()=>{
 assert.equal(offerTotal({quantity:2},{rate:400,charge:80}),720);
 const l=act({...base(),category:'plastics',quantity:1},'sample_offers');assert.ok(l.offers.every(o=>offerTotal(l,o)>0));
});
test('issues preserve history and halt confirmation',()=>{
 let l=act(handover(),'dispute','collector',{reason:'Weight does not match'});assert.equal(l.stage,'disputed');assert.ok(l.notes.includes('Weight does not match'));
 assert.throws(()=>act(l,'confirm_handover'),/ready/);
});
test('UPI requires an external reference and does not trigger a payment',()=>{
 const l=act(handover(),'confirm_handover');assert.throws(()=>act(l,'record_payment','recycler',{amount:1,method:'upi',reference:''}),/reference/);
});
