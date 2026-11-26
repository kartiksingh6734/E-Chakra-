import assert from 'node:assert/strict';
import test from 'node:test';

test('device deletion suspends old sessions, including after an explicit online reopen', async t => {
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  const window = new EventTarget();
  let reloads = 0;
  window.location = { pathname: '/', search: '', reload() { reloads++; } };
  window.history = { replaceState() {} };
  let deletion;
  const globals = {
    window, localStorage: storage, sessionStorage: storage,
    indexedDB: { deleteDatabase(name) {
      assert.equal(name, 'echakra-offline-v1');
      return (deletion = {});
    } },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }

  const tab = await import('../lib/device-storage.ts?active');
  const stop = tab.watchDevice(() => {});
  const pending = tab.deviceSignal();
  const cleared = tab.clearDeviceData();
  assert.ok(pending.aborted);
  assert.ok(tab.deviceMarker().startsWith('clearing:'));
  await assert.rejects(tab.reopenDevice());
  deletion.onsuccess();
  await cleared;
  assert.ok(tab.deviceMarker().startsWith('paused:'));
  assert.throws(() => tab.deviceSignal());

  const paused = await import('../lib/device-storage.ts?paused');
  assert.equal(paused.deviceIsActive(), false);
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(paused.reopenDevice());
  assert.equal(reloads, 0);
  fetch.mock.mockImplementation(async () => Response.json({ scope: 'current-account' }));
  await paused.reopenDevice();
  assert.equal(reloads, 1);
  assert.equal(tab.deviceIsActive(), false);
  assert.equal(paused.deviceIsActive(), false);
  const fresh = await import('../lib/device-storage.ts?fresh');
  assert.equal(fresh.deviceIsActive(), true);
  stop();
  for (const { arguments: [url, options] } of fetch.mock.calls) {
    assert.equal(url, '/api/ec');
    assert.equal(options.method ?? 'GET', 'GET');
  }
});
