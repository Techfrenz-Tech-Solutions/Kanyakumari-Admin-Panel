import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildArticleQuery,
  createArticlesApi,
  mapArticle,
  mapArticlePayload,
} from '../src/api/articles.js';

test('dedicated article status routes render the server-backed NewsList', () => {
  const root = process.cwd();
  for (const [file, status] of [
    ['DraftsList.jsx', 'draft'],
    ['PublishedList.jsx', 'published'],
    ['ScheduledList.jsx', 'scheduled'],
    ['PendingApproval.jsx', 'pending'],
    ['BreakingNews.jsx', 'breaking'],
  ]) {
    const source = readFileSync(join(root, 'src/pages', file), 'utf8');
    assert.match(source, new RegExp(`fixedStatus=["']${status}["']`), `${file} must use status-filtered NewsList`);
    assert.doesNotMatch(source, /loadData|saveData|mockData/, `${file} must not use browser-local mock articles`);
  }
});

test('buildArticleQuery maps supported list filters and omits empty values', () => {
  const query = buildArticleQuery({
    page: 2,
    limit: 25,
    status: 'published',
    category: 'local-news',
    search: '  harbour  ',
    isBreaking: true,
    isFeatured: false,
    sort: '-createdAt',
    ignored: 'value',
  });
  assert.equal(query, 'page=2&limit=25&status=published&category=local-news&search=harbour&isBreaking=true&sort=-createdAt');
});

test('mapArticle preserves localized and relational fields and derives image URL', () => {
  const source = {
    id: 7,
    title: 'English', titleTA: 'தமிழ்', excerpt: 'Excerpt', excerptTA: 'சுருக்கம்',
    content: '<p>Body</p>', contentTA: '<p>உள்ளடக்கம்</p>',
    category: 'District', categoryId: 2,
    subCategory: 'Nagercoil', subcategoryId: 3,
    author: 'Reporter', authorId: 4,
    area: 'coast', areaId: 5,
    featuredImage: { id: 9, url: 'https://cdn.test/story.jpg' },
    tags: ['one', 'இரண்டு'], isBreaking: true, isFeatured: true,
  };
  assert.deepEqual(mapArticle(source), {
    ...source,
    shortDescription: 'Excerpt',
    image: 'https://cdn.test/story.jpg',
    featuredImageId: 9,
    subCategoryId: 3,
  });
});

test('mapArticlePayload produces validator-compatible create/update fields without dropping Tamil', () => {
  const payload = mapArticlePayload({
    title: 'English', titleTA: 'தமிழ்', shortDescription: 'Excerpt', excerptTA: 'சுருக்கம்',
    content: '<p>Body</p>', contentTA: '<p>உள்ளடக்கம்</p>',
    categoryId: '2', subCategoryId: '3', authorId: '4', areaId: '5',
    location: '', featuredImageId: '9', tags: [' one ', '', 'இரண்டு'],
    isBreaking: true, isFeatured: false, status: 'scheduled',
    publishDate: '2026-08-27', publishTime: '10:30', scheduledAt: '',
    uiOnly: 'ignored',
  });
  assert.deepEqual(payload, {
    title: 'English', titleTA: 'தமிழ்', excerpt: 'Excerpt', excerptTA: 'சுருக்கம்',
    content: '<p>Body</p>', contentTA: '<p>உள்ளடக்கம்</p>',
    categoryId: 2, subcategoryId: 3, authorId: 4, areaId: 5,
    location: null, featuredImageId: 9, tags: ['one', 'இரண்டு'],
    isBreaking: true, isFeatured: false, status: 'scheduled',
    publishDate: '2026-08-27', publishTime: '10:30',
  });
});

test('articles API performs list, CRUD, lifecycle, reference, and media requests', async () => {
  const calls = [];
  const client = { request: async (path, options = {}) => {
    calls.push([path, options]);
    if (path.startsWith('/api/admin/news?')) return { items: [{ id: 1, excerpt: 'x' }], total: 1, page: 1, limit: 10, totalPages: 1 };
    if (path === '/api/admin/media?kind=image&page=1&limit=100') return { items: [] };
    return { id: 1, excerpt: 'x' };
  } };
  const api = createArticlesApi(client);

  const listed = await api.list({ page: 1, limit: 10, status: 'draft' });
  await api.get(1);
  await api.create({ title: 'A' });
  await api.update(1, { title: 'B' });
  await api.remove(1);
  await api.changeStatus(1, 'reject', 'Needs sources');
  await api.listCategories();
  await api.listSubcategories();
  await api.listReporters();
  await api.listAreas();
  await api.listMedia();
  const form = new FormData(); form.append('file', new Blob(['image']), 'story.jpg');
  await api.uploadMedia(form);

  assert.equal(listed.items[0].shortDescription, 'x');
  assert.deepEqual(calls.slice(0, 6), [
    ['/api/admin/news?page=1&limit=10&status=draft', {}],
    ['/api/admin/news/1', {}],
    ['/api/admin/news', { method: 'POST', body: { title: 'A' } }],
    ['/api/admin/news/1', { method: 'PUT', body: { title: 'B' } }],
    ['/api/admin/news/1', { method: 'DELETE' }],
    ['/api/admin/news/1/status', { method: 'POST', body: { action: 'reject', reason: 'Needs sources' } }],
  ]);
  assert.deepEqual(calls.slice(6).map(([path]) => path), [
    '/api/admin/categories?limit=100', '/api/admin/subcategories?limit=100',
    '/api/admin/reporters?limit=100', '/api/admin/areas?limit=100',
    '/api/admin/media?kind=image&page=1&limit=100', '/api/admin/upload',
  ]);
  assert.equal(calls.at(-1)[1].body, form);
});
