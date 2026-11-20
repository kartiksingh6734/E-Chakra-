// The generation survives a clear/reopen so suspended tabs cannot write old
// snapshots or start uploads after another tab resumes the workspace.
export const deviceKey = 'echakra-device-session';
export const databaseName = 'echakra-offline-v1';
const changed = 'echakra-device-change';
let initial: string | undefined;
const lifetime = new AbortController();

export function deviceMarker() {
  try { return localStorage.getItem(deviceKey) || ''; }
  catch { return ''; }
}
export function deviceIsActive() {
  const marker = deviceMarker();
  initial ??= marker;
  return initial === marker && (!marker || marker.startsWith('open:')) && !lifetime.signal.aborted;
}
export function deviceSignal() {
  if (!deviceIsActive()) throw new Error('Offline storage is paused on this device.');
  return lifetime.signal;
}
export function watchDevice(notify: () => void) {
  function update() {
    if (!deviceIsActive()) {
      lifetime.abort();
      try { sessionStorage.removeItem('echakra-role'); } catch {}
    }
    notify();
  }
  function onStorage(event: StorageEvent) {
    if (event.key === deviceKey || event.key === null) update();
  }
  window.addEventListener(changed, update);
  window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', update);
  window.addEventListener('focus', update);
  return () => {
    window.removeEventListener(changed, update);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pageshow', update);
    window.removeEventListener('focus', update);
  };
}
function setMarker(marker: string) {
  localStorage.setItem(deviceKey, marker);
  window.dispatchEvent(new Event(changed));
}
export async function clearDeviceData() {
  const current = deviceMarker();
  const clearing = current.startsWith('clearing:') ? current : 'clearing:' + crypto.randomUUID();
  setMarker(clearing);
  await new Promise<void>((resolve, reject) => {
    const deletion = indexedDB.deleteDatabase(databaseName);
    deletion.onsuccess = () => resolve();
    deletion.onerror = () => reject(deletion.error);
  });
  if (deviceMarker() === clearing) setMarker(clearing.replace('clearing:', 'paused:'));
}
export async function reopenDevice() {
  const marker = deviceMarker();
  if (marker.startsWith('clearing:')) throw new Error('Clearing is in progress');
  const response = await fetch('/api/ec', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Connection required');
  const snapshot = await response.json();
  if (!snapshot || typeof snapshot !== 'object' || !('scope' in snapshot) || typeof snapshot.scope !== 'string') throw new Error('Connection required');
  if (deviceMarker() !== marker) throw new Error('Device state changed');
  if (marker.startsWith('paused:')) setMarker(marker.replace('paused:', 'open:'));
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  window.location.reload();
}
