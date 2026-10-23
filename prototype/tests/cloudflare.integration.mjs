import {spawn, spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';

const state = await mkdtemp(join(tmpdir(), 'echakra-cloudflare-'));
const env = {...process.env, CI: 'true', CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false', WRANGLER_WRITE_LOGS: 'false'};
const cli = ['node_modules/wrangler/bin/wrangler.js'];
const settings = JSON.parse(await readFile('wrangler.cloudflare.json', 'utf8'));
settings.main = resolve(settings.main);
settings.assets.directory = resolve(settings.assets.directory);
settings.d1_databases[0].migrations_dir = resolve(settings.d1_databases[0].migrations_dir);
// Wrangler's test-scheduled HTTP middleware must run before SPA asset routing.
// This route exists only in this temporary local harness, never the deploy config.
settings.assets.run_worker_first.push('/__scheduled');
const testConfig = join(state, 'wrangler-test.json');
await writeFile(testConfig, JSON.stringify(settings));
const config = ['--config', testConfig];
function command(args, capture = false) {
  const result = spawnSync(process.execPath, [...cli, ...args, ...config], {env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit'});
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  return result.stdout;
}
let server;
let logs = '';
try {
  command(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', state]);
  // Repeating setup must not destroy or duplicate the schema.
  command(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', state], true);
  const port = await new Promise((resolve, reject) => {
    const probe = createServer(); probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {const value = probe.address().port; probe.close(() => resolve(value));});
  });
  const base = 'http://127.0.0.1:' + port;
  server = spawn(process.execPath, [...cli, 'dev', ...config, '--local', '--persist-to', state, '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0', '--test-scheduled'], {env, stdio: ['ignore', 'pipe', 'pipe']});
  server.stdout.on('data', b => logs += b); server.stderr.on('data', b => logs += b);
  let ready = false;
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {if ((await fetch(base + '/')).ok) {ready = true; break;}} catch {}
  }
  assert.ok(ready, 'Worker failed to start');
  function client() {
    return {cookie: '', async req(path, body, options = {}) {
      const {headers, ...rest} = options;
      const response = await fetch(base + path, {
        method: body ? 'POST' : 'GET', ...rest,
        headers: {...(this.cookie ? {Cookie: this.cookie} : {}), ...(body ? {'Content-Type': 'application/json', Origin: base} : {}), ...headers},
        body: body ? JSON.stringify(body) : undefined,
      });
      const cookie = response.headers.get('set-cookie');
      if (cookie) this.cookie = cookie.split(';')[0];
      const text = await response.text(); let data;
      try {data = JSON.parse(text);} catch {data = text;}
      return {status: response.status, data, headers: response.headers};
    }};
  }
  const a = client(), b = client();
  const initial = await a.req('/api/ec');
  assert.equal(initial.status, 200);
  assert.match(initial.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
  assert.deepEqual(initial.data.lots, []);
  const second = await b.req('/api/ec', undefined, {headers: {'oai-authenticated-user-id': initial.data.scope}});
  assert.notEqual(second.data.scope, initial.data.scope, 'Untrusted identity header must not select another owner');
  assert.equal((await client().req('/api/ec', {action: 'profile', profile: {name: 'Test', location: 'Delhi', language: 'en'}})).status, 401);
  assert.equal((await a.req('/api/ec', {action: 'profile', profile: {name: 'Test collector', location: 'Test facility', language: 'en'}})).status, 200);
  const draft = {id: crypto.randomUUID(), category: 'pcb', quantity: 10, condition: 'scrap', location: 'Test facility', notes: 'synthetic test', createdAt: new Date().toISOString()};
  let lot = (await a.req('/api/ec', {action: 'create_lot', lot: draft})).data.lot;
  assert.ok(lot?.id);
  assert.equal((await a.req('/api/ec', {action: 'create_lot', lot: draft})).data.lot.id, lot.id);
  assert.equal((await a.req('/api/ec', {action: 'create_lot', lot: {...draft, id: crypto.randomUUID(), quantity: -1}})).status, 400);
  assert.equal((await a.req('/api/ec', {action: 'create_lot', lot: {...draft, id: crypto.randomUUID(), photoId: crypto.randomUUID()}})).status, 400);
  async function act(action, role, extra = {}) {
    const input = {action, role, id: lot.id, version: lot.version, opId: crypto.randomUUID(), ...extra};
    const result = await a.req('/api/ec', input);
    assert.equal(result.status, 200, JSON.stringify(result.data));
    lot = result.data.lot;
    return input;
  }
  const sample = await act('sample_offers', 'collector');
  const replay = await a.req('/api/ec', sample);
  assert.equal(replay.data.lot.version, lot.version, 'Retry must not duplicate an operation');
  assert.equal((await b.req('/api/ec', {...sample, opId: crypto.randomUUID()})).status, 404);
  assert.equal((await a.req('/api/ec', {...sample, version: 1, opId: crypto.randomUUID()})).status, 409);
  await act('accept_offer', 'collector', {offerId: lot.offers[0].id});
  await act('propose_handover', 'recycler', {quantity: 9, amount: 3000, location: 'Test receiving desk'});
  await act('confirm_handover', 'collector');
  await act('record_payment', 'recycler', {amount: 3000, method: 'cash'});
  assert.equal(lot.stage, 'received');
  await act('confirm_payment', 'collector', {paymentId: lot.payments[0].id});
  assert.equal(lot.stage, 'paid');
  const restored = client(); restored.cookie = a.cookie;
  assert.equal((await restored.req('/api/ec')).data.lots[0].stage, 'paid');
  assert.deepEqual((await b.req('/api/ec')).data.lots, []);

  const photo = await readFile('public/icon-192.png'), mediaId = crypto.randomUUID();
  async function upload(id, body, who = a, type = 'image/png') {
    return fetch(base + '/api/media?id=' + id, {method: 'PUT', headers: {Cookie: who.cookie, Origin: base, 'Content-Type': type}, body});
  }
  assert.equal((await upload(mediaId, photo)).status, 200);
  assert.equal((await upload(mediaId, photo)).status, 200);
  assert.equal((await upload(mediaId, photo, b)).status, 409);
  const media = await fetch(base + '/api/media?id=' + mediaId, {headers: {Cookie: a.cookie}});
  assert.equal(media.status, 200);
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), photo);
  assert.equal((await b.req('/api/media?id=' + mediaId)).status, 404);
  assert.equal((await client().req('/api/media?id=' + mediaId)).status, 401);
  // Exercise chunk boundaries and the complete 2 MB path without a real recording.
  const large = Buffer.alloc(2_000_000, 31), largeId = crypto.randomUUID();
  assert.equal((await upload(largeId, large, a, 'audio/webm')).status, 200);
  const restoredLarge = await fetch(base + '/api/media?id=' + largeId, {headers: {Cookie: a.cookie}});
  assert.deepEqual(Buffer.from(await restoredLarge.arrayBuffer()), large);
  assert.equal((await upload(crypto.randomUUID(), Buffer.alloc(2_000_001))).status, 413);
  assert.equal((await upload(crypto.randomUUID(), photo, a, 'text/html')).status, 400);
  assert.equal((await a.req('/api/ec', {action: 'create_lot', lot: {...draft, id: crypto.randomUUID(), photoId: mediaId, audioId: largeId}})).status, 200);
  assert.equal((await b.req('/api/ec', {action: 'create_lot', lot: {...draft, id: crypto.randomUUID(), photoId: mediaId}})).status, 400);

  assert.equal((await a.req('/api/ec', {action: 'profile'}, {headers: {Origin: 'https://evil.invalid'}})).status, 403);
  assert.equal((await a.req('/api/ec', {action: 'profile'}, {headers: {Origin: ''}})).status, 403);
  assert.equal((await a.req('/api/ec', undefined, {headers: {'Sec-Fetch-Site': 'cross-site'}})).status, 403);
  assert.equal((await fetch(base + '/api/ec', {method: 'POST', headers: {Cookie: a.cookie, Origin: base}, body: 'null'})).status, 400);
  assert.equal((await a.req('/api/ec', {padding: 'x'.repeat(20_001)})).status, 413);
  assert.equal((await a.req('/api/ec', undefined, {method: 'DELETE'})).status, 405);
  assert.equal((await a.req('/api/unknown')).status, 404);

  // Enforce per-session media quota atomically; a failed write must not leave chunks.
  for (let i = 0; i < 18; i++) assert.equal((await upload(crypto.randomUUID(), photo)).status, 200);
  assert.equal((await upload(crypto.randomUUID(), photo)).status, 429);
  const page = await fetch(base + '/'); const html = await page.text();
  assert.equal(page.status, 200); assert.match(html, /E-CHAKRA/);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const path of ['/manifest.webmanifest', '/sw.js', '/icon-192.png', '/icon-512.png']) assert.equal((await fetch(base + path)).status, 200, path);
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) assert.equal((await fetch(base + match[1])).status, 200);

  // Expiry cleanup cascades only demo data; stale cookies cannot reopen it.
  command(['d1', 'execute', 'DB', '--local', '--persist-to', state, '--command', 'UPDATE sessions SET expires_at=0'], true);
  assert.equal((await a.req('/api/ec', {action: 'profile', profile: {name: 'Expired', location: 'Delhi', language: 'en'}})).status, 401);
  const scheduled = await fetch(base + '/__scheduled?cron=17%20*%20*%20*%20*');
  assert.equal(scheduled.status, 200, await scheduled.text());
  const afterExpiry = await a.req('/api/ec');
  assert.notEqual(afterExpiry.data.scope, initial.data.scope); assert.deepEqual(afterExpiry.data.lots, []);
  const count = command(['d1', 'execute', 'DB', '--local', '--persist-to', state, '--command', 'SELECT count(*) AS chunks FROM media_chunks', '--json'], true);
  assert.equal(JSON.parse(count)[0].results[0].chunks, 0);
  console.log('PASS: standalone Cloudflare full journey, persistent sessions, forged-header isolation, scoped uploads, 2 MB chunk round trip, retries, origin/validation checks, quotas, expiry cascade and static/PWA assets.');
} catch (error) {
  console.error('Local Cloudflare worker output:\n' + logs.slice(-7000));
  throw error;
} finally {
  if (server) {
    const closed = new Promise(resolve => server.once('close', resolve));
    server.kill('SIGTERM'); const timeout = setTimeout(() => server.kill('SIGKILL'), 5000); timeout.unref();
    await closed; clearTimeout(timeout);
  }
  await rm(state, {recursive: true, force: true});
}
