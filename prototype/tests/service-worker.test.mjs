import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://example.test';
const href = input => new URL(typeof input === 'string' ? input : input.url, origin).href;

function worker(fetch) {
  const handlers = new Map();
  const stores = new Map();
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        match: async key => data.get(href(key))?.clone(),
        put: async (key, value) => data.set(href(key), value)
      };
    },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name)
  };
  const self = {
    location: { origin },
    addEventListener: (name, handle) => handlers.set(name, handle),
    skipWaiting() {},
    clients: { claim() {} }
  };
  runInNewContext(source, { self, caches, URL, Response, fetch });
  function dispatch(name, data) {
    let promise;
    const capture = value => { promise = value; };
    handlers.get(name)({ ...data, waitUntil: capture, respondWith: capture });
    return promise;
  }
  const request = (path, mode = 'navigate') => dispatch('fetch', {
    request: { method: 'GET', mode, url: href(path) }
  });
  return { dispatch, request, caches };
}

test('only the public home page can become the offline navigation fallback', async () => {
  let online = true;
  let privatePage = false;
  const { request } = worker(async () => {
    if (!online) throw new Error('offline');
    return new Response(privatePage ? 'private HTML' : 'collector shell', {
      headers: { 'content-type': 'text/html', ...(privatePage && { 'cache-control': 'private, no-store' }) }
    });
  });
  assert.equal(await (await request('/')).text(), 'collector shell');
  privatePage = true;
  assert.equal(await (await request('/')).text(), 'private HTML');
  for (const path of ['/api/ec', '/api/media?id=1', '/signin-with-chatgpt', '/signout-with-chatgpt',
    '/callback', '/other-page', '/?return_to=demo']) {
    assert.equal(request(path), undefined);
  }
  online = false;
  assert.equal(await (await request('/')).text(), 'collector shell');
});

test('asset warm-up handles only public build files and never stores a login response as script', async () => {
  const requested = [];
  const good = '/_next/static/chunks/collector-Xyz.js';
  const expired = '/_next/static/chunks/expired-Abc.js';
  const { dispatch, request } = worker(async input => {
    const url = href(input);
    requested.push(url);
    return url === href(good)
      ? new Response('collector', { headers: { 'content-type': 'application/javascript' } })
      : new Response('sign in', { headers: { 'content-type': 'text/html' } });
  });
  await dispatch('message', { data: { type: 'CACHE_SHELL', urls: [
    good, good, expired, '/api/ec', '/signout-with-chatgpt', '/other.css', 'https://cdn.example.test/app.js'
  ] } });
  assert.deepEqual(requested, [href(good), href(expired)]);
  assert.equal(await (await request(good, 'cors')).text(), 'collector');
  await request(expired, 'cors');
  assert.deepEqual(requested, [href(good), href(expired), href(expired)]);
  assert.equal(request('/api/media?id=example', 'cors'), undefined);
});

test('activation retires the old shell cache without touching other apps', async () => {
  const { dispatch, caches } = worker(async () => { throw new Error('offline'); });
  await caches.open('echakra-shell-v1');
  await caches.open('another-app');
  await dispatch('install');
  await dispatch('activate');
  assert.deepEqual(await caches.keys(), ['another-app', 'echakra-shell-v2']);
});
