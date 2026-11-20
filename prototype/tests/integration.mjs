import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const state = await mkdtemp(join(tmpdir(), 'echakra-integration-'));
const primary = { 'oai-authenticated-user-id': 'integration-owner' };
const secondary = { 'oai-authenticated-user-id': 'other-owner' };
let server;
let closed;
let logs = '';

try {
  const migration = spawnSync(process.execPath, ['scripts/migrate-local.mjs', '--persist-to', state], { cwd: root, stdio: 'inherit' });
  if (migration.error) throw migration.error;
  assert.equal(migration.status, 0, 'Fresh database migration failed');

  const port = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
  const base = 'http://127.0.0.1:' + port;
  server = spawn(process.execPath, [
    '--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js',
    'dev', '--config', 'dist/server/wrangler.json', '--local', '--persist-to', state,
    '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0',
  ], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  closed = new Promise(resolve => server.once('close', resolve));
  let spawnError;
  server.once('error', error => { spawnError = error; });
  const collect = chunk => { logs = (logs + chunk).slice(-10000); };
  server.stdout.on('data', collect);
  server.stderr.on('data', collect);

  async function request(path, options = {}) {
    return fetch(base + path, { ...options, signal: AbortSignal.timeout(10000) });
  }

  async function ready(path, headers = {}) {
    const deadline = Date.now() + 30000;
    let lastResponse;
    do {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null || server.signalCode) throw new Error('Local worker exited during startup');
      try {
        const response = await request(path, { headers });
        const body = await response.text();
        if (response.ok) return body;
        lastResponse = response.status + ' ' + body.slice(0, 2500);
      } catch (error) {
        lastResponse = error.message;
      }
      await sleep(300);
    } while (Date.now() < deadline);
    throw new Error('Local route ' + path + ' did not become ready: ' + lastResponse);
  }

  async function post(input, headers = primary, status = 200) {
    const response = await request('/api/ec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    const body = await response.text();
    assert.equal(response.status, status, (input?.action || 'JSON request') + ': ' + body.slice(0, 1500));
    return JSON.parse(body);
  }

  async function snapshot(headers) {
    const response = await request('/api/ec', { headers });
    assert.equal(response.status, 200);
    return response.json();
  }

  const initial = JSON.parse(await ready('/api/ec', primary));
  const other = await snapshot(secondary);
  assert.ok(initial.scope && other.scope);
  assert.notEqual(initial.scope, other.scope);
  const scoped = { ...primary, 'X-E-Chakra-Scope': initial.scope };
  const switched = { ...secondary, 'X-E-Chakra-Scope': initial.scope };
  assert.equal((await request('/api/ec')).status, 401);
  const profile = { name: 'Collector', location: 'Delhi', language: 'en' };
  const profileWrite = { action: 'profile', profile };
  await post(profileWrite, switched, 409);
  await post(profileWrite, { ...primary, Origin: 'https://not-this-app.invalid' }, 403);
  assert.deepEqual((await snapshot(secondary)).profile, other.profile);
  assert.deepEqual((await snapshot(primary)).profile, initial.profile);
  assert.deepEqual((await post(profileWrite, scoped)).profile, profile);
  await post(null, scoped, 400);
  await post([], scoped, 400);
  await post({ action: 'profile', padding: 'a'.repeat(20000) }, scoped, 413);

  const photoId = crypto.randomUUID();
  const mediaPath = '/api/media?id=' + photoId;
  const image = await readFile(join(root, 'public/icon-192.png'));
  async function upload(headers, bytes = image) {
    return request(mediaPath, { method: 'PUT', headers: { 'Content-Type': 'image/png', ...headers }, body: bytes });
  }
  assert.equal((await upload(scoped, new Uint8Array())).status, 400);
  assert.equal((await upload(scoped, new Uint8Array(2_000_001))).status, 413);
  const mislabeled = await request(mediaPath, {
    method: 'PUT', headers: { ...scoped, 'Content-Type': 'audio/ogg' }, body: image,
  });
  assert.equal(mislabeled.status, 400);
  assert.equal((await upload(switched)).status, 409);
  assert.equal((await request(mediaPath, { headers: secondary })).status, 404);
  const uploads = await Promise.all([upload(scoped), upload(scoped)]);
  for (const response of uploads) {
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Cache-Control') || '', /no-store/);
    assert.deepEqual(await response.json(), { id: photoId });
  }
  assert.equal((await upload(primary, await readFile(join(root, 'public/icon-512.png')))).status, 409);
  assert.equal((await upload(secondary)).status, 409);
  const media = await request(mediaPath, { headers: primary });
  assert.equal(media.status, 200);
  assert.equal(media.headers.get('Content-Type'), 'image/png');
  assert.match(media.headers.get('Cache-Control') || '', /no-store/);
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), image);
  assert.equal((await request(mediaPath, { headers: secondary })).status, 404);

  const draft = {
    id: crypto.randomUUID(), category: 'pcb', quantity: 10, condition: 'scrap',
    location: 'Test facility', notes: 'Integration lot', createdAt: new Date().toISOString(),
  };
  await post({ action: 'create_lot', lot: draft }, switched, 409);
  assert.ok(!(await snapshot(secondary)).lots.some(lot => lot.id === draft.id));
  await post({ action: 'create_lot', lot: { ...draft, quantity: -3 } }, scoped, 400);
  await post({ action: 'create_lot', lot: { ...draft, audioId: photoId } }, scoped, 400);
  const create = { action: 'create_lot', lot: { ...draft, photoId } };
  let { lot } = await post(create, scoped);
  assert.equal(lot.photoId, photoId);
  assert.deepEqual((await post(create, scoped)).lot, lot);

  function operation(action, role, properties) {
    return { action, role, id: lot.id, version: lot.version, opId: crypto.randomUUID(), ...properties };
  }
  async function act(action, role, properties) {
    lot = (await post(operation(action, role, properties), scoped)).lot;
  }
  await act('sample_offers', 'collector');
  const accept = operation('accept_offer', 'collector', { offerId: lot.offers[0].id });
  await post(accept, secondary, 404);
  await post({ ...accept, version: lot.version - 1 }, scoped, 409);
  lot = (await post(accept, scoped)).lot;
  await act('propose_handover', 'recycler', { quantity: 9, amount: 3000, location: 'Test receiving desk' });
  await act('confirm_handover', 'collector');

  const payment = operation('record_payment', 'recycler', { amount: 3000, method: 'cash' });
  const [first, retry] = await Promise.all([post(payment, scoped), post(payment, scoped)]);
  lot = first.lot;
  assert.deepEqual(retry.lot, lot);
  assert.equal(lot.version, payment.version + 1);
  assert.equal(lot.stage, 'received');
  assert.equal(lot.payments.length, 1);
  assert.equal(lot.payments[0].confirmedAt, undefined);
  await act('confirm_payment', 'collector', { paymentId: lot.payments[0].id });
  assert.equal(lot.stage, 'paid');
  assert.deepEqual((await snapshot(primary)).lots.find(item => item.id === lot.id), lot);
  assert.ok(!(await snapshot(secondary)).lots.some(item => item.id === lot.id));

  const html = await ready('/');
  assert.match(html, /E-CHAKRA/);
  for (const path of ['/manifest.webmanifest', '/sw.js', '/icon-192.png', '/icon-512.png']) {
    assert.equal((await request(path)).status, 200, path);
  }
  console.log('PASS: lot-to-payment workflow, concurrent retries, scoped writes, private media, account isolation, request validation and PWA assets.');
} catch (error) {
  console.error('Local worker output:\n' + logs);
  throw error;
} finally {
  if (server && closed) {
    server.kill('SIGTERM');
    const timeout = setTimeout(() => server.kill('SIGKILL'), 5000);
    timeout.unref();
    await closed;
    clearTimeout(timeout);
  }
  await rm(state, { recursive: true, force: true });
}
