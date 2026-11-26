import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  GoogleAuthProvider, RecaptchaVerifier, onAuthStateChanged, signInWithPhoneNumber, signInWithPopup, signOut,
  type Auth, type ConfirmationResult, type User,
} from 'firebase/auth';
import { Recycle } from 'lucide-react';
import { languageKey, roleKey, setPagesUser } from '../lib/device-storage';
import { openAuth } from './firebase';
import './sign-in.css';

const project = 'https://github.com/kartiksingh6734/E-Chakra-';
const copy = {
  en: {
    title: 'Collector workspace', intro: 'Record e-waste lots, compare offers and track your payments on this device.',
    google: 'Continue with Google', phone: 'Mobile number with country code', send: 'Send SMS code',
    code: '6-digit verification code', verify: 'Verify and sign in', change: 'Use another number or resend',
    consent: 'Google will receive your number to verify it and prevent abuse. SMS charges may apply.',
    waiting: 'Google and mobile sign-in will open once the project owner connects Firebase. The walkthrough is available now.',
    setup: 'Firebase setup guide', video: 'Collector walkthrough', source: 'View on GitHub',
    loading: 'Opening your workspace…', retry: 'Reload', loadError: 'Could not load sign-in settings.',
    out: 'Sign out', account: 'Signed in', sent: 'Check your phone for the SMS code.',
    invalid: 'Enter a mobile number with its country code, starting with +.',
    wrongCode: 'That code was not accepted. Check the digits or request a new code.',
    expired: 'The code expired. Request a new one.', blocked: 'Allow pop-ups for this site and try again.',
    cancelled: 'Sign-in was cancelled. You can try again.', network: 'Check your internet connection and try again.',
    throttled: 'Too many requests. Please wait before trying again.', setupError: 'This sign-in method needs attention from the project owner.',
    failed: 'Sign-in could not be completed. Try again.', signingOutFailed: 'Could not sign out. Please try again.',
  },
  hi: {
    title: 'कलेक्टर कार्यक्षेत्र', intro: 'इस डिवाइस पर ई-कचरे की खेप दर्ज करें, ऑफर की तुलना करें और भुगतान देखें।',
    google: 'Google से जारी रखें', phone: 'देश कोड सहित मोबाइल नंबर', send: 'SMS कोड भेजें',
    code: '6 अंकों का सत्यापन कोड', verify: 'कोड की पुष्टि करके साइन इन करें', change: 'दूसरा नंबर या नया कोड',
    consent: 'सत्यापन और दुरुपयोग रोकने के लिए आपका नंबर Google को भेजा जाएगा। SMS शुल्क लग सकते हैं।',
    waiting: 'प्रोजेक्ट का मालिक Firebase जोड़ने के बाद Google और मोबाइल साइन-इन चालू करेगा। अभी डेमो देख सकते हैं।',
    setup: 'Firebase सेटअप गाइड', video: 'कलेक्टर डेमो', source: 'GitHub पर देखें',
    loading: 'कार्यक्षेत्र खुल रहा है…', retry: 'फिर लोड करें', loadError: 'साइन-इन सेटिंग लोड नहीं हुई।',
    out: 'साइन आउट', account: 'साइन इन हैं', sent: 'SMS कोड के लिए अपना फोन देखें।',
    invalid: 'मोबाइल नंबर + और देश कोड के साथ डालें।', wrongCode: 'कोड स्वीकार नहीं हुआ। अंक जांचें या नया कोड मांगें।',
    expired: 'कोड की अवधि समाप्त हो गई। नया कोड मांगें।', blocked: 'इस साइट के लिए पॉप-अप की अनुमति दें।',
    cancelled: 'साइन-इन रद्द हो गया। फिर कोशिश कर सकते हैं।', network: 'इंटरनेट जांचकर फिर कोशिश करें।',
    throttled: 'बहुत अधिक प्रयास हुए। थोड़ी देर बाद कोशिश करें।', setupError: 'प्रोजेक्ट के मालिक को इस साइन-इन विधि की सेटिंग जांचनी होगी।',
    failed: 'साइन-इन पूरा नहीं हुआ। फिर कोशिश करें।', signingOutFailed: 'साइन आउट नहीं हुआ। फिर कोशिश करें।',
  },
  mr: {
    title: 'संकलक कार्यक्षेत्र', intro: 'या डिव्हाइसवर ई-कचऱ्याच्या खेपा नोंदवा, ऑफरची तुलना करा आणि देयके पाहा.',
    google: 'Google वापरून पुढे जा', phone: 'देशाच्या कोडसह मोबाइल क्रमांक', send: 'SMS कोड पाठवा',
    code: '६ अंकी पडताळणी कोड', verify: 'पडताळा आणि साइन इन करा', change: 'दुसरा क्रमांक किंवा नवीन कोड',
    consent: 'पडताळणीसाठी आणि गैरवापर टाळण्यासाठी तुमचा क्रमांक Google ला पाठवला जाईल. SMS शुल्क लागू होऊ शकते.',
    waiting: 'प्रकल्पाच्या मालकाने Firebase जोडल्यानंतर Google आणि मोबाइल साइन-इन सुरू होईल. आत्ता डेमो पाहू शकता.',
    setup: 'Firebase सेटअप मार्गदर्शक', video: 'संकलक डेमो', source: 'GitHub वर पाहा',
    loading: 'कार्यक्षेत्र उघडत आहे…', retry: 'पुन्हा लोड करा', loadError: 'साइन-इन सेटिंग लोड झाली नाही.',
    out: 'साइन आउट', account: 'साइन इन केले आहे', sent: 'SMS कोडसाठी तुमचा फोन पाहा.',
    invalid: '+ आणि देशाच्या कोडसह मोबाइल क्रमांक द्या.', wrongCode: 'कोड स्वीकारला नाही. अंक तपासा किंवा नवीन कोड मागवा.',
    expired: 'कोडची मुदत संपली. नवीन कोड मागवा.', blocked: 'या साइटसाठी पॉप-अपला परवानगी द्या.',
    cancelled: 'साइन-इन रद्द झाले. पुन्हा प्रयत्न करू शकता.', network: 'इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.',
    throttled: 'खूप विनंत्या आल्या. थोड्या वेळाने पुन्हा प्रयत्न करा.', setupError: 'प्रकल्पाच्या मालकाने या साइन-इन पद्धतीची सेटिंग तपासावी.',
    failed: 'साइन-इन पूर्ण झाले नाही. पुन्हा प्रयत्न करा.', signingOutFailed: 'साइन आउट झाले नाही. पुन्हा प्रयत्न करा.',
  },
};
type Lang = keyof typeof copy;
type Labels = typeof copy.en;
type View =
  | { state: 'loading' | 'unconfigured' | 'error' }
  | { state: 'ready'; auth: Auth; user: User | null };

function savedLanguage(): Lang {
  try {
    const value = localStorage.getItem(languageKey);
    if (value === 'hi' || value === 'mr' || value === 'en') return value;
  } catch {}
  const value = navigator.language.split('-')[0];
  return value === 'hi' || value === 'mr' ? value : 'en';
}

function message(error: unknown): keyof Labels {
  const code = typeof error === 'object' && error && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/invalid-phone-number': return 'invalid';
    case 'auth/invalid-verification-code': return 'wrongCode';
    case 'auth/code-expired': case 'auth/session-expired': return 'expired';
    case 'auth/popup-blocked': return 'blocked';
    case 'auth/popup-closed-by-user': case 'auth/cancelled-popup-request': return 'cancelled';
    case 'auth/network-request-failed': return 'network';
    case 'auth/too-many-requests': case 'auth/quota-exceeded': return 'throttled';
    case 'auth/unauthorized-domain': case 'auth/operation-not-allowed': case 'auth/invalid-api-key':
    case 'auth/billing-not-enabled': case 'auth/app-not-authorized': return 'setupError';
    default: return 'failed';
  }
}

function SignInForm({ auth, labels }: { auth: Auth; labels: Labels }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof Labels | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const captcha = useRef<RecaptchaVerifier | null>(null);
  useEffect(() => () => { captcha.current?.clear(); captcha.current = null; }, []);
  async function google() {
    setBusy(true);
    setError(null);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (pending) {
        await pending.confirm(code.trim());
      } else {
        const number = phone.replace(/[\s()-]/g, '');
        if (!/^\+[1-9]\d{6,14}$/.test(number)) { setError('invalid'); return; }
        if (!host.current) return;
        const verifier = new RecaptchaVerifier(auth, host.current, { size: 'invisible' });
        captcha.current = verifier;
        setPending(await signInWithPhoneNumber(auth, number, verifier));
      }
    } catch (e) { setError(message(e)); }
    finally {
      captcha.current?.clear();
      captcha.current = null;
      setBusy(false);
    }
  }
  return <div className="login-methods">
    <button className="btn secondary full" type="button" disabled={busy} onClick={() => void google()}>{labels.google}</button>
    <form className="stack" onSubmit={submit}>
      {pending
        ? <><p role="status">{labels.sent}</p><label>{labels.code}
          <input autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)}/>
        </label></>
        : <label>{labels.phone}
          <input type="tel" autoComplete="tel" placeholder="+91 …" required value={phone} onChange={e => setPhone(e.target.value)}/>
        </label>}
      {!pending && <small>{labels.consent}</small>}
      <div ref={host}/>
      <button className="btn primary full" disabled={busy}>{pending ? labels.verify : labels.send}</button>
      {pending && <button type="button" className="btn ghost" disabled={busy} onClick={() => {
        setCode(''); setError(null); setPending(null);
      }}>{labels.change}</button>}
    </form>
    {error && <p className="login-error" role="alert">{labels[error]}</p>}
  </div>;
}

export function SignInGate({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ state: 'loading' });
  const [lang, setLang] = useState<Lang>(savedLanguage);
  const [logoutError, setLogoutError] = useState(false);
  const t = copy[lang];
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void openAuth().then(auth => {
      if (!active) return;
      if (!auth) { setView({ state: 'unconfigured' }); return; }
      const identity = (user: User | null) => user && JSON.stringify([auth.app.options.projectId, user.uid]);
      unsubscribe = onAuthStateChanged(auth, user => {
        setPagesUser(identity(user), () => identity(auth.currentUser));
        setLogoutError(false);
        setView({ state: 'ready', auth, user });
      }, () => { setPagesUser(null); setView({ state: 'error' }); });
    }).catch(() => { if (active) { setPagesUser(null); setView({ state: 'error' }); } });
    return () => { active = false; unsubscribe?.(); setPagesUser(null); };
  }, []);
  const signedIn = view.state === 'ready' && !!view.user;
  useEffect(() => {
    if (!signedIn) {
      document.documentElement.lang = lang;
      try { localStorage.setItem(languageKey, lang); } catch {}
    }
  }, [lang, signedIn]);
  if (view.state === 'ready' && view.user) {
    return <Fragment key={view.user.uid}>
      <header className="account-strip" lang={lang}>
        <span>{t.account}{view.user.displayName && ' · ' + view.user.displayName}</span>
        <button type="button" onClick={() => void signOut(view.auth).then(() => {
          try { sessionStorage.removeItem(roleKey); } catch {}
          window.history.replaceState(null, '', location.pathname);
          setLang(savedLanguage());
        }).catch(() => setLogoutError(true))}>{t.out}</button>
        {logoutError && <span role="alert">{t.signingOutFailed}</span>}
      </header>
      {children}
    </Fragment>;
  }
  return <div className="login-shell" lang={lang}>
    <header className="login-nav"><strong><Recycle size={24} aria-hidden="true"/> E-CHAKRA</strong>
      <select aria-label="Language / भाषा" value={lang} onChange={event => {
        const next = event.target.value as Lang;
        setLang(next);
        try { localStorage.setItem(languageKey, next); } catch {}
      }}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select>
    </header>
    <main className="login-grid">
      <section className="login-panel"><h1>{t.title}</h1><p>{t.intro}</p>
        {view.state === 'loading' && <p role="status">{t.loading}</p>}
        {view.state === 'ready' && <SignInForm auth={view.auth} labels={t}/>}
        {view.state === 'unconfigured' && <div className="login-status"><p>{t.waiting}</p>
          <a href={project + '/blob/main/docs/github-pages.md'}>{t.setup}</a></div>}
        {view.state === 'error' && <div className="login-status"><p role="alert">{t.loadError}</p>
          <button className="btn secondary" onClick={() => window.location.reload()}>{t.retry}</button></div>}
        <a className="login-source" href={project}>{t.source} ↗</a>
      </section>
      <section className="login-preview"><h2>{t.video}</h2>
        <video controls playsInline preload="none" poster="./walkthrough.png" src="./walkthrough.webm" aria-label={t.video}/>
        <a href="./walkthrough.webm">{t.video} ↗</a>
      </section>
    </main>
  </div>;
}
