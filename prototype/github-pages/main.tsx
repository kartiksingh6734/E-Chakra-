import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { DeviceGate } from '../app/device-data';
import '../app/globals.css';
import { SignInGate } from './sign-in';

const CollectorApp = lazy(() => import('../app/collector-app'));

createRoot(document.getElementById('root')!).render(
  <SignInGate><DeviceGate><Suspense fallback={<p aria-busy="true">E-CHAKRA…</p>}><CollectorApp /></Suspense></DeviceGate></SignInGate>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(error => {
    console.warn('E-CHAKRA could not install the offline application shell.', error);
  });
}
