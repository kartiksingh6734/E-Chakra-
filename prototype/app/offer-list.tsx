'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { BUYERS, categoryOf, money, offerTotal, type Lot, type Role } from '@/lib/domain';
import type { Key } from '@/lib/i18n';

type Props = {
  lot: Lot;
  role: Role;
  disabled: boolean;
  t: (key: Key) => string;
  onAccept: (id: string) => void;
};

export function OfferList({ lot, role, disabled, t, onAccept }: Props) {
  const [now, setNow] = useState(Date.now);
  const offers = lot.offers.map(offer => ({
    offer,
    total: offerTotal(lot, offer),
    expires: Date.parse(offer.expiresAt),
  })).sort((a, b) => Number(a.expires <= now) - Number(b.expires <= now) || b.total - a.total);

  const nextExpiry = Math.min(...offers.map(item => item.expires).filter(time => time > now));
  useEffect(() => {
    if (!Number.isFinite(nextExpiry)) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, nextExpiry - Date.now()));
    return () => clearTimeout(timer);
  }, [nextExpiry]);

  return offers.map(({ offer, total, expires }, index) => {
    const buyer = BUYERS.find(item => item.id === offer.buyerId)!;
    const expired = expires <= now;
    return <div className={'offer-card '+(index === 0 && !expired ? 'best' : '')} key={offer.id}>
      <div className="row between"><div><h3>{buyer.name}</h3><small>{t(buyer.kind === 'repair' ? 'reusable' : 'recycler')}</small></div><span className="material-icon"><Store size={24}/></span></div>
      <p className="sample-note" style={{marginTop:8}}>{t('sampleBuyer')}</p>
      <div className="breakdown"><span>{t('rate')}</span><span>{money(offer.rate)} / {t(categoryOf(lot.category).unit)}</span></div>
      <div className="breakdown"><span>{t('transport')}</span><span>{money(offer.charge)}</span></div>
      <div className="breakdown"><span>{t(offer.pickup ? 'pickup' : 'dropoff')}</span><span>{buyer.distance} km · {t('distance')}</span></div>
      <div className="breakdown total"><span>{t('net')}</span><span className="offer-total">{money(total)}</span></div>
      {role === 'collector' && <button className="btn primary full" disabled={disabled || expired} onClick={() => onAccept(offer.id)}>{t(expired ? 'expired' : 'choose')}</button>}
    </div>;
  });
}
