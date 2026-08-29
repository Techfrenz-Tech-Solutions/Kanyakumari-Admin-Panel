import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiClientError, createApiClient } from '../src/api/client.js';

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const success = (data) => jsonResponse(200, { success: true, data });
const failure = (status, code, message) => jsonResponse(status, {
  success: false,
  error: { code, message },
});

test('defaults to same-origin API paths when no build-time host is configured', async () => {
  let capturedUrl;
  const client = createApiClient({
    fetchImpl: async (url) => {
      capturedUrl = url;
      return success({ ok: true });
    },
  });
  await client.request('/api/health');
  assert.equal(capturedUrl, '/api/health');
});

test('sends JSON, credentials, and the in-memory bearer token', async () => {
  let captured;
  const client = createApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return success({ saved: true });
    },
  });
  client.setAccessToken('access-token');

  const result = await client.request('/resource', { method: 'POST', body: { title: 'Story' } });

  assert.deepEqual(result, { saved: true });
  assert.equal(captured.url, 'https://api.example.test/resource');
  assert.equal(captured.options.credentials, 'include');
  assert.equal(captured.options.headers.Authorization, 'Bearer access-token');
  assert.equal(captured.options.headers['Content-Type'], 'application/json');
  assert.equal(captured.options.body, JSON.stringify({ title: 'Story' }));
});

test('normalizes API and network errors', async (t) => {
  await t.test('structured API error', async () => {
    const client = createApiClient({ fetchImpl: async () => failure(422, 'VALIDATION_ERROR', 'Invalid input') });
    await assert.rejects(client.request('/resource', { retryAuth: false }), (error) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 422);
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.message, 'Invalid input');
      return true;
    });
  });

  await t.test('network error', async () => {
    const client = createApiClient({ fetchImpl: async () => { throw new TypeError('offline'); } });
    await assert.rejects(client.request('/resource'), { code: 'NETWORK_ERROR', status: 0 });
  });
});

test('coalesces simultaneous 401 responses into one refresh and retries each request once', async () => {
  let refreshCalls = 0;
  let resourceCalls = 0;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      if (url.endsWith('/api/admin/auth/refresh')) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return success({ accessToken: 'fresh-token', user: { id: '1' } });
      }
      resourceCalls += 1;
      return options.headers.Authorization === 'Bearer fresh-token'
        ? success({ url })
        : failure(401, 'UNAUTHORIZED', 'Expired');
    },
  });
  client.setAccessToken('expired-token');

  const results = await Promise.all([
    client.request('/one'), client.request('/two'), client.request('/three'),
  ]);

  assert.equal(results.length, 3);
  assert.equal(refreshCalls, 1);
  assert.equal(resourceCalls, 6);
  assert.equal(client.getAccessToken(), 'fresh-token');
});

test('clears the session once when a shared refresh fails', async () => {
  let expiredEvents = 0;
  let refreshCalls = 0;
  const client = createApiClient({
    fetchImpl: async (url) => {
      if (url.endsWith('/api/admin/auth/refresh')) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
      return failure(401, 'UNAUTHORIZED', 'Expired');
    },
  });
  client.setAccessToken('expired-token');
  client.setSessionHandlers({ onSessionExpired: () => { expiredEvents += 1; } });

  const outcomes = await Promise.allSettled([client.request('/one'), client.request('/two')]);

  assert.ok(outcomes.every(({ status }) => status === 'rejected'));
  assert.equal(refreshCalls, 1);
  assert.equal(expiredEvents, 1);
  assert.equal(client.getAccessToken(), null);
});

test('does not refresh or expire the session on a 403 response', async () => {
  let calls = 0;
  let expiredEvents = 0;
  const client = createApiClient({
    fetchImpl: async () => {
      calls += 1;
      return failure(403, 'FORBIDDEN', 'Not permitted');
    },
  });
  client.setSessionHandlers({ onSessionExpired: () => { expiredEvents += 1; } });

  await assert.rejects(client.request('/restricted'), { status: 403, code: 'FORBIDDEN' });
  assert.equal(calls, 1);
  assert.equal(expiredEvents, 0);
});

test('retries no more than once after a successful refresh', async () => {
  let resourceCalls = 0;
  let refreshCalls = 0;
  const client = createApiClient({
    fetchImpl: async (url) => {
      if (url.endsWith('/api/admin/auth/refresh')) {
        refreshCalls += 1;
        return success({ accessToken: 'fresh-token', user: {} });
      }
      resourceCalls += 1;
      return failure(401, 'UNAUTHORIZED', 'Still unauthorized');
    },
  });

  await assert.rejects(client.request('/resource'), { status: 401 });
  assert.equal(refreshCalls, 1);
  assert.equal(resourceCalls, 2);
});

test('distinguishes request timeout from caller cancellation', async (t) => {
  const abortingFetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });

  await t.test('timeout', async () => {
    const client = createApiClient({ timeoutMs: 5, fetchImpl: abortingFetch });
    await assert.rejects(client.request('/slow'), { code: 'REQUEST_TIMEOUT' });
  });

  await t.test('caller cancellation', async () => {
    const controller = new AbortController();
    const client = createApiClient({ timeoutMs: 100, fetchImpl: abortingFetch });
    const pending = client.request('/slow', { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { code: 'REQUEST_ABORTED' });
  });
});
