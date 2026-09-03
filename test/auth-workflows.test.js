import assert from 'node:assert/strict';
import test from 'node:test';

import { createAuthApi } from '../src/api/auth.js';
import {
  authenticationDecision,
  claimSessionBootstrap,
  changePasswordAndEndSession,
  permissionDecision,
  restoreSession,
} from '../src/auth/session.js';

test('session bootstrap gate allows exactly one effect pass under React StrictMode', () => {
  const gate = { current: false };
  assert.equal(claimSessionBootstrap(gate), true);
  assert.equal(claimSessionBootstrap(gate), false);
  assert.equal(claimSessionBootstrap(gate), false);
});

function recordingClient() {
  const calls = [];
  let token = null;
  return {
    calls,
    get token() { return token; },
    setAccessToken(value) { token = value; },
    async request(path, options = {}) {
      calls.push({ path, options });
      return path.endsWith('/login')
        ? { accessToken: 'login-token', user: { id: 'admin-1' } }
        : { accepted: true };
    },
    async refreshSession() {
      calls.push({ path: '/api/admin/auth/refresh', options: { method: 'POST' } });
      return { accessToken: 'refresh-token', user: { id: 'admin-1' } };
    },
  };
}

test('login sends the canonical body and retains the returned access token only in memory', async () => {
  const client = recordingClient();
  const api = createAuthApi(client);
  const result = await api.login('editor@example.com', 'secret-pass');

  assert.equal(client.token, 'login-token');
  assert.deepEqual(result.user, { id: 'admin-1' });
  assert.deepEqual(client.calls[0], {
    path: '/api/admin/auth/login',
    options: {
      method: 'POST',
      body: { email: 'editor@example.com', password: 'secret-pass' },
      includeAuth: false,
      retryAuth: false,
    },
  });
});

test('login failures remain failures and do not fabricate a user', async () => {
  const expected = Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
  const api = createAuthApi({
    request: async () => { throw expected; },
    setAccessToken: () => assert.fail('failed login must not set a token'),
  });
  await assert.rejects(api.login('admin@example.com', 'wrong-password'), expected);
});

test('session bootstrap refreshes the cookie session and verifies the current user', async () => {
  const calls = [];
  const restored = await restoreSession({
    refresh: async () => {
      calls.push('refresh');
      return { accessToken: 'restored-token' };
    },
    me: async () => {
      calls.push('me');
      return { user: { id: 'admin-1', permissions: ['news.view'] } };
    },
  });

  assert.deepEqual(calls, ['refresh', 'me']);
  assert.deepEqual(restored, {
    accessToken: 'restored-token',
    user: { id: 'admin-1', permissions: ['news.view'] },
  });
});

test('failed session bootstrap rejects instead of authenticating locally', async () => {
  await assert.rejects(restoreSession({
    refresh: async () => { throw Object.assign(new Error('No session'), { status: 401 }); },
    me: async () => assert.fail('me should not run after refresh failure'),
  }), { status: 401 });
});

test('auth workflow endpoints use the backend contract', async () => {
  const client = recordingClient();
  const api = createAuthApi(client);

  await api.forgotPassword('admin@example.com');
  await api.resetPassword('reset-token', 'new-password');
  await api.updateProfile({ name: 'News Editor', phone: '1234', bio: 'Editor' });
  await api.changePassword('old-password', 'new-password');
  await api.logout();

  assert.deepEqual(client.calls, [
    { path: '/api/admin/auth/forgot-password', options: { method: 'POST', body: { email: 'admin@example.com' }, includeAuth: false, retryAuth: false } },
    { path: '/api/admin/auth/reset-password', options: { method: 'POST', body: { token: 'reset-token', newPassword: 'new-password' }, includeAuth: false, retryAuth: false } },
    { path: '/api/admin/auth/profile', options: { method: 'PUT', body: { name: 'News Editor', phone: '1234', bio: 'Editor' } } },
    { path: '/api/admin/auth/password', options: { method: 'PUT', body: { currentPassword: 'old-password', newPassword: 'new-password' } } },
    { path: '/api/admin/auth/logout', options: { method: 'POST', body: {}, retryAuth: false } },
  ]);
});

test('route decisions distinguish loading, login, allow, and 403 states', () => {
  assert.equal(authenticationDecision({ isInitializing: true, isAuthenticated: false }), 'initializing');
  assert.equal(authenticationDecision({ isInitializing: false, isAuthenticated: false }), 'login');
  assert.equal(authenticationDecision({ isInitializing: false, isAuthenticated: true }), 'allow');
  assert.equal(permissionDecision({ hasPermission: () => true, permission: 'news.edit' }), 'allow');
  assert.equal(permissionDecision({ hasPermission: () => false, permission: 'news.edit' }), 'denied');
});

test('a successful password change ends the current browser session', async () => {
  const calls = [];
  await changePasswordAndEndSession(
    { changePassword: async (current, next) => calls.push(['password', current, next]) },
    async () => calls.push(['logout']),
    'old-password',
    'new-password',
  );
  assert.deepEqual(calls, [
    ['password', 'old-password', 'new-password'],
    ['logout'],
  ]);
});
