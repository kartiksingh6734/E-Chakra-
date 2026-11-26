'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { NativeSelect } from '@/components/ui/native-select';
import { BUYERS, categoryOf, offerTotal, selectedOffer, unrecordedBalance, validBuyer, type Lot } from '@/lib/domain';
import type { Key } from '@/lib/i18n';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="field"><label>{label}{children}</label>{hint && <small>{hint}</small>}</div>;
}

type FormProps = {
  lot: Lot;
  disabled: boolean;
  t: (key: Key) => string;
  perform: (action: string, fields: Record<string, unknown>) => Promise<void>;
};

export function OfferForm({ lot, disabled, t, perform }: FormProps) {
  const category = categoryOf(lot.category);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform('create_offer', {
      buyerId: data.get('buyer'), rate: Number(data.get('rate')),
      charge: Number(data.get('charge')), pickup: data.get('transport') === 'pickup',
    });
  }
  return <form className="card stack" onSubmit={submit}>
    <h2>{t('submitOffer')}</h2>
    <Field label={t('buyer')}><NativeSelect name="buyer">
      {BUYERS.filter(buyer => validBuyer(lot, buyer.id)).map(buyer => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}
    </NativeSelect></Field>
    <div className="grid-2">
      <Field label={t('rate')+' / '+t(category.unit)}><input name="rate" required type="number" min=".01" max="1000000" step=".01" defaultValue={category.rate}/></Field>
      <Field label={t('transport')}><input name="charge" required type="number" min="0" step=".01" defaultValue="0"/></Field>
    </div>
    <Field label={t('pickup')}><NativeSelect name="transport">
      <option value="pickup">{t('pickup')}</option><option value="dropoff">{t('dropoff')}</option>
    </NativeSelect></Field>
    <button className="btn primary" disabled={disabled}>{t('submitOffer')}</button>
  </form>;
}

export function HandoverForm({ lot, disabled, t, perform }: FormProps) {
  const unit = categoryOf(lot.category).unit;
  const increment = unit === 'piece' ? 1 : 0.01;
  const offer = selectedOffer(lot);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform('propose_handover', {
      quantity: Number(data.get('quantity')), amount: Number(data.get('amount')), location: data.get('location'),
    });
  }
  return <form className="card stack" onSubmit={submit}>
    <h2>{t('propose')}</h2>
    <div className="grid-2">
      <Field label={t('actualQty')+' ('+t(unit)+')'}><input name="quantity" required type="number" min={increment} step={increment} max="100000" defaultValue={lot.quantity}/></Field>
      <Field label={t('finalAmount')}><input name="amount" required type="number" min=".01" step=".01" max="100000000" defaultValue={offer ? offerTotal(lot, offer) : ''}/></Field>
    </div>
    <Field label={t('handoverLocation')}><input name="location" required minLength={2} maxLength={150} defaultValue={lot.location}/></Field>
    <button className="btn primary" disabled={disabled}>{t('propose')}</button>
  </form>;
}

export function PaymentForm({ lot, disabled, t, perform }: FormProps) {
  const balance = unrecordedBalance(lot);
  const [method, setMethod] = useState('cash');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform('record_payment', {
      amount: Number(data.get('amount')), method, reference: data.get('reference') ?? '',
    });
  }
  return <form className="stack" onSubmit={submit}>
    <h3>{t('recordPayment')}</h3>
    <div className="grid-2">
      <Field label={t('amount')}><input name="amount" required type="number" min=".01" step=".01" max={balance} defaultValue={balance}/></Field>
      <Field label={t('method')}><NativeSelect value={method} onChange={event => setMethod(event.target.value)}>
        <option value="cash">{t('cash')}</option><option value="upi">{t('upi')}</option>
      </NativeSelect></Field>
    </div>
    {method === 'upi' && <Field label={t('paymentRef')}><input name="reference" required minLength={4} maxLength={100}/></Field>}
    <p className="caption">{t('paymentHint')}</p>
    <button className="btn primary" disabled={disabled}>{t('recordPayment')}</button>
  </form>;
}
