import assert from 'node:assert/strict';
import test from 'node:test';

import { createTaxonomyApi } from '../src/api/taxonomy.js';
import { createReportersApi } from '../src/api/reporters.js';
import { createUsersApi } from '../src/api/users.js';
import { createMediaApi } from '../src/api/media.js';

function recordingClient(result = null) {
  const calls = [];
  return {
    calls,
    request: async (...args) => {
      calls.push(args);
      return typeof result === 'function' ? result(...args) : result;
    },
  };
}

test('taxonomy APIs use the admin CRUD contracts', async () => {
  const client = recordingClient([]);
  const api = createTaxonomyApi(client);

  await api.categories.list();
  await api.categories.create({ name: 'Local', status: 'active' });
  await api.categories.update(7, { name: 'District' });
  await api.categories.remove(7);
  await api.subcategories.list();
  await api.subcategories.create({ name: 'Nagercoil', parentCategory: 7 });
  await api.subcategories.update(8, { status: 'inactive' });
  await api.subcategories.remove(8);
  await api.areas.list();
  await api.areas.create({ name: 'Agastheeswaram' });
  await api.areas.update(9, { status: 'inactive' });
  await api.areas.remove(9);

  assert.deepEqual(client.calls, [
    ['/api/admin/categories', {}],
    ['/api/admin/categories', { method: 'POST', body: { name: 'Local', status: 'active' } }],
    ['/api/admin/categories/7', { method: 'PUT', body: { name: 'District' } }],
    ['/api/admin/categories/7', { method: 'DELETE' }],
    ['/api/admin/subcategories', {}],
    ['/api/admin/subcategories', { method: 'POST', body: { name: 'Nagercoil', parentCategory: 7 } }],
    ['/api/admin/subcategories/8', { method: 'PUT', body: { status: 'inactive' } }],
    ['/api/admin/subcategories/8', { method: 'DELETE' }],
    ['/api/admin/areas', {}],
    ['/api/admin/areas', { method: 'POST', body: { name: 'Agastheeswaram' } }],
    ['/api/admin/areas/9', { method: 'PUT', body: { status: 'inactive' } }],
    ['/api/admin/areas/9', { method: 'DELETE' }],
  ]);
});

test('reporter and user APIs preserve payloads and never add passwords to updates', async () => {
  const client = recordingClient([]);
  const reporters = createReportersApi(client);
  const users = createUsersApi(client);

  await reporters.list();
  await reporters.create({ name: 'Malar', designation: 'Reporter' });
  await reporters.update(3, { phone: '123' });
  await reporters.remove(3);
  await users.list();
  await users.create({ name: 'Editor', email: 'e@example.com', role: 'editor', extraPermissions: ['news:edit'] });
  await users.update(4, { name: 'Editor 2', role: 'admin', extraPermissions: [] });
  await users.remove(4);

  assert.deepEqual(client.calls, [
    ['/api/admin/reporters'],
    ['/api/admin/reporters', { method: 'POST', body: { name: 'Malar', designation: 'Reporter' } }],
    ['/api/admin/reporters/3', { method: 'PUT', body: { phone: '123' } }],
    ['/api/admin/reporters/3', { method: 'DELETE' }],
    ['/api/admin/users'],
    ['/api/admin/users', { method: 'POST', body: { name: 'Editor', email: 'e@example.com', role: 'editor', extraPermissions: ['news:edit'] } }],
    ['/api/admin/users/4', { method: 'PUT', body: { name: 'Editor 2', role: 'admin', extraPermissions: [] } }],
    ['/api/admin/users/4', { method: 'DELETE' }],
  ]);
});

test('media API encodes list filters and uploads raw FormData', async () => {
  const client = recordingClient({ items: [], total: 0, page: 2, limit: 12, totalPages: 0 });
  const media = createMediaApi(client);
  const file = new Blob(['image-bytes'], { type: 'image/png' });

  await media.list({ q: 'front page', kind: 'image', page: 2, limit: 12 });
  await media.upload(file, 'image');
  await media.remove(42);

  assert.equal(client.calls[0][0], '/api/admin/media?q=front+page&kind=image&page=2&limit=12');
  assert.equal(client.calls[1][0], '/api/admin/upload');
  assert.equal(client.calls[1][1].method, 'POST');
  assert.ok(client.calls[1][1].body instanceof FormData);
  const uploaded = client.calls[1][1].body.get('file');
  assert.equal(uploaded.type, file.type);
  assert.equal(uploaded.size, file.size);
  assert.equal(client.calls[1][1].body.get('kind'), 'image');
  assert.deepEqual(client.calls[2], ['/api/admin/media/42', { method: 'DELETE' }]);
});
