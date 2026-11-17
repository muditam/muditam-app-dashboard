import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './widget-token.js';

test('public broker never issues a token or calls upstream, even with configured credentials', async () => {
  const originalFetch = globalThis.fetch;
  const oldUser = process.env.WIDGET_ADMIN_USERNAME;
  const oldPassword = process.env.WIDGET_ADMIN_PASSWORD;
  process.env.WIDGET_ADMIN_USERNAME = 'test';
  process.env.WIDGET_ADMIN_PASSWORD = 'test-only';
  globalThis.fetch = () => { throw new Error('Upstream must not be called'); };
  try {
    for (const method of ['POST', 'GET', 'PUT']) {
      const response = {
        headers: {}, setHeader(key, value) { this.headers[key] = value; },
        status(value) { this.statusCode = value; return this; },
        json(value) { this.body = value; return this; },
      };
      await handler({ method }, response);
      assert.equal(response.statusCode, method === 'POST' ? 401 : 405);
      assert.equal(response.body.token, undefined);
      assert.equal(response.headers['Cache-Control'], 'no-store');
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of [['WIDGET_ADMIN_USERNAME', oldUser], ['WIDGET_ADMIN_PASSWORD', oldPassword]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
