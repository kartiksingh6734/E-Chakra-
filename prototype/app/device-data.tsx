'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Lang } from '@/lib/domain';
import { clearDeviceData, deviceIsActive, deviceMarker, reopenDevice, watchDevice } from '@/lib/device-storage';

const copy = {
  en: {
    clear: 'Clear offline data on this device',
    confirm: 'Permanently delete offline data for every E-CHAKRA account on this device? Unsynced drafts, photos and recordings will be lost. Records already uploaded will stay in your account.',
    paused: 'Offline data cleared',
    clearing: 'Clearing offline data',
    wait: 'If clearing takes a while, close other E-CHAKRA tabs and try again.',
    retry: 'Retry clearing',
    reopen: 'Reopen online',
    resume: 'Connect and reopen E-CHAKRA to load your records.',
    error: 'Could not complete this action. Check your connection and browser storage, then try again.',
  },
  hi: {
    clear: 'इस डिवाइस से ऑफलाइन डेटा हटाएं',
    confirm: 'इस डिवाइस के सभी E-CHAKRA खातों का ऑफलाइन डेटा हमेशा के लिए हटाएं? बिना सिंक की गई खेप, फोटो और रिकॉर्डिंग खो जाएंगी। पहले से अपलोड किए गए रिकॉर्ड आपके खाते में रहेंगे।',
    paused: 'ऑफलाइन डेटा हटा दिया गया',
    clearing: 'ऑफलाइन डेटा हटाया जा रहा है',
    wait: 'अगर समय लग रहा है, तो दूसरे E-CHAKRA टैब बंद करके फिर कोशिश करें।',
    retry: 'फिर से हटाने की कोशिश करें',
    reopen: 'ऑनलाइन दोबारा खोलें',
    resume: 'अपने रिकॉर्ड देखने के लिए इंटरनेट से जुड़ें और E-CHAKRA दोबारा खोलें।',
    error: 'काम पूरा नहीं हुआ। इंटरनेट और ब्राउज़र स्टोरेज जांचकर फिर कोशिश करें।',
  },
  mr: {
    clear: 'या डिव्हाइसवरील ऑफलाइन डेटा हटवा',
    confirm: 'या डिव्हाइसवरील सर्व E-CHAKRA खात्यांचा ऑफलाइन डेटा कायमचा हटवायचा? सिंक न झालेल्या खेपा, फोटो व रेकॉर्डिंग गमावले जातील. आधी अपलोड केलेल्या नोंदी तुमच्या खात्यात राहतील.',
    paused: 'ऑफलाइन डेटा हटवला',
    clearing: 'ऑफलाइन डेटा हटवत आहे',
    wait: 'वेळ लागत असल्यास इतर E-CHAKRA टॅब बंद करा आणि पुन्हा प्रयत्न करा.',
    retry: 'हटवण्यासाठी पुन्हा प्रयत्न करा',
    reopen: 'ऑनलाइन पुन्हा उघडा',
    resume: 'तुमच्या नोंदी पाहण्यासाठी इंटरनेट जोडा आणि E-CHAKRA पुन्हा उघडा.',
    error: 'कृती पूर्ण झाली नाही. इंटरनेट आणि ब्राउझर स्टोरेज तपासून पुन्हा प्रयत्न करा.',
  },
};

export function ClearDeviceButton({ lang }: { lang: Lang }) {
  const [failed, setFailed] = useState(false);
  const t = copy[lang];
  return <>
    <button className="btn danger" type="button" onClick={() => {
      if (window.confirm(t.confirm)) void clearDeviceData().catch(() => setFailed(true));
    }}>{t.clear}</button>
    {failed && <p role="alert">{t.error}</p>}
  </>;
}

function view() {
  if (deviceIsActive()) return 'active';
  return deviceMarker().startsWith('clearing:') ? 'clearing' : 'paused';
}
const serverView = () => 'loading';
export function DeviceGate({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(watchDevice, view, serverView);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (state === 'loading') return <main className="card" aria-busy="true">E-CHAKRA</main>;
  if (state === 'active') return children;
  let lang: Lang = 'hi';
  try {
    const stored = localStorage.getItem('echakra-language');
    if (stored === 'mr' || stored === 'en') lang = stored;
  } catch {}
  const t = copy[lang];
  const clearing = state === 'clearing';
  async function proceed() {
    setBusy(true);
    setFailed(false);
    try { await (clearing ? clearDeviceData() : reopenDevice()); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  }
  return <main className="app-layout" lang={lang}>
    <section className="card stack" style={{gridColumn: '1 / -1'}}>
      <strong>E-CHAKRA</strong>
      <h1>{clearing ? t.clearing : t.paused}</h1>
      <p>{clearing ? t.wait : t.resume}</p>
      {failed && <p role="alert">{t.error}</p>}
      <button className="btn secondary" disabled={busy} onClick={() => void proceed()}>{clearing ? t.retry : t.reopen}</button>
    </section>
  </main>;
}
