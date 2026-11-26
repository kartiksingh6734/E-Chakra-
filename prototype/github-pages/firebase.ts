import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

const configKey = 'echakra-pages:' + import.meta.env.BASE_URL + ':firebase-config';

function webConfig(value: unknown): FirebaseOptions | null {
  if (!value || typeof value !== 'object') return null;
  const { apiKey, authDomain, projectId, appId } = value as FirebaseOptions;
  if (![apiKey, authDomain, projectId, appId].every(field => typeof field === 'string' && field.trim())) return null;
  return { apiKey, authDomain, projectId, appId };
}

async function loadConfig(): Promise<FirebaseOptions | null> {
  if (import.meta.env.VITE_FIREBASE_CONFIG) return webConfig(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
  let response: Response;
  try {
    response = await fetch(import.meta.env.BASE_URL + 'firebase-config.json', { cache: 'no-store' });
  } catch (error) {
    // Only the public web configuration is cached, so Firebase can restore its
    // persisted user when a previously opened app is reloaded offline.
    const saved = localStorage.getItem(configKey);
    if (saved) return webConfig(JSON.parse(saved));
    throw error;
  }
  if (!response.ok && response.status !== 404) throw new Error('Sign-in settings could not be loaded.');
  const config = response.ok ? webConfig(await response.json()) : null;
  try {
    if (config) localStorage.setItem(configKey, JSON.stringify(config));
    else localStorage.removeItem(configKey);
  } catch { /* The Firebase SDK manages its own session persistence. */ }
  return config;
}

export async function openAuth(): Promise<Auth | null> {
  const config = await loadConfig();
  if (!config) return null;
  const app = initializeApp(config, 'echakra-pages:' + import.meta.env.BASE_URL + ':' + config.projectId);
  const auth = getAuth(app);
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR === 'true' &&
      ['localhost', '127.0.0.1'].includes(location.hostname)) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return auth;
}
