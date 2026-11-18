import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformTokenCache } from './platformTokenCache.js';

test('concurrent requests share one token refresh, and refresh before expiry', async () => {
  let now = 1_000, calls = 0;
  const cache = createPlatformTokenCache(async () => ({ token: `token-${++calls}`, expiresAt: now + 300_000 }), () => now);
  assert.deepEqual(await Promise.all([cache.get(), cache.get(), cache.get()]), ['token-1', 'token-1', 'token-1']);
  now += 200_000;
  assert.equal(await cache.get(), 'token-1');
  now += 80_000;
  assert.equal(await cache.get(), 'token-2');
  cache.clear();
  assert.equal(await cache.get(), 'token-3');
});

test('failed issuance is not cached and expired tokens are rejected', async () => {
  let calls = 0;
  const cache = createPlatformTokenCache(async () => {
    if (++calls === 1) throw new Error('Unauthorized');
    return { token: 'new', expiresAt: 500_000 };
  }, () => 1_000);
  await assert.rejects(cache.get(), /Unauthorized/);
  assert.equal(await cache.get(), 'new');
  await assert.rejects(createPlatformTokenCache(async () => ({ token: 'old', expiresAt: 999 }), () => 1_000).get(), /Invalid dashboard/);
});

test('logout cannot be undone by an in-flight token response', async () => {
  let complete;
  const cache = createPlatformTokenCache(() => new Promise(resolve => { complete = resolve; }));
  const pending = cache.get();
  await Promise.resolve();
  cache.clear();
  complete({ token: 'old-session', expiresAt: Date.now() + 300_000 });
  await assert.rejects(pending, /Session changed/);
});

test('simultaneous expired-token responses do not invalidate a shared refresh', async () => {
  let calls = 0;
  const cache = createPlatformTokenCache(async () => ({ token: `token-${++calls}`, expiresAt: Date.now() + 300_000 }));
  const old = await cache.get();
  cache.clear(old);
  const refresh = cache.get();
  cache.clear(old);
  assert.deepEqual(await Promise.all([refresh, cache.get()]), ['token-2', 'token-2']);
  cache.clear(old);
  assert.equal(await cache.get(), 'token-2');
  assert.equal(calls, 2);
});
