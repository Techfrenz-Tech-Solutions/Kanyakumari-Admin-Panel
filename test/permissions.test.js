import assert from 'node:assert/strict';
import test from 'node:test';

import { filterNavigation, hasAnyPermission, hasPermission, hasRole } from '../src/auth/permissions.js';

test('uses only permissions supplied by the authenticated backend user', () => {
  const user = { role: 'editor', permissions: ['dashboard.view', 'news.view', 'news.edit'] };
  assert.equal(hasPermission(user, 'news.view'), true);
  assert.equal(hasPermission(user, 'users.view'), false);
  assert.equal(hasAnyPermission(user, ['users.view', 'news.edit']), true);
  assert.equal(hasRole(user, 'editor'), true);
});

test('supports the backend super-admin wildcard', () => {
  const user = { role: 'super_admin', permissions: ['*'] };
  assert.equal(hasPermission(user, 'users.delete'), true);
  assert.equal(hasAnyPermission(user, ['settings.edit']), true);
});

test('filters both navigation groups and action links by effective permissions', () => {
  const sections = [
    {
      label: 'Content',
      items: [
        { label: 'Dashboard', path: '/', permission: 'dashboard.view' },
        { label: 'News', path: '/news', permission: 'news.view' },
        { label: 'Add News', path: '/news/new', permission: 'news.create' },
      ],
    },
    {
      label: 'Administration',
      items: [{ label: 'Users', path: '/users', permission: 'users.view' }],
    },
  ];
  const filtered = filterNavigation(sections, { permissions: ['dashboard.view', 'news.view'] });

  assert.deepEqual(filtered, [{
    label: 'Content',
    items: [
      { label: 'Dashboard', path: '/', permission: 'dashboard.view' },
      { label: 'News', path: '/news', permission: 'news.view' },
    ],
  }]);
});
