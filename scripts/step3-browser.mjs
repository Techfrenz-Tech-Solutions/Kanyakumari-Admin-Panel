import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseUrl = process.env.KKN_ADMIN_URL || 'http://192.168.0.120:5173';
const apiUrl = process.env.KKN_API_URL || 'http://192.168.0.120:3001';
const password = process.env.KKN_BROWSER_PASSWORD;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/mnt/EXT1/pw-browsers/chromium-1148/chrome-linux/chrome';
if (!password) throw new Error('KKN_BROWSER_PASSWORD is required');

const marker = `step3-${Date.now()}`;
const names = {
  category: `Step3 Category ${marker}`,
  subcategory: `Step3 Subcategory ${marker}`,
  area: `Step3 Area ${marker}`,
  reporter: `Step3 Reporter ${marker}`,
  article: `Step3 Article ${marker}`,
  scheduledArticle: `Step3 Scheduled ${marker}`,
};
const adminEmail = 'step3-admin@smoke.kkn.test';
const restrictedEmail = 'step3-restricted@smoke.kkn.test';
const tempDir = await mkdtemp('/mnt/EXT1/kkn-step3-browser-');
const imagePath = `${tempDir}/${marker}.png`;
await writeFile(imagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));

const field = (label) => page.locator('.field').filter({ has: page.locator('label', { hasText: label }) }).first();
const modal = () => page.locator('.modal-box').last();
const rowFor = (text) => page.locator('tr').filter({ hasText: text }).first();

async function login(email) {
  await page.goto(`${baseUrl}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}

async function apiSession(email) {
  return page.evaluate(async ({ apiUrl: target, email: userEmail, password: userPassword }) => {
    const response = await fetch(`${target}/api/admin/auth/login`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || 'API login failed');
    return payload.data.accessToken;
  }, { apiUrl, email, password });
}

async function apiRequest(token, path, options = {}) {
  return page.evaluate(async ({ apiUrl: target, token: accessToken, path: requestPath, options: requestOptions }) => {
    const response = await fetch(`${target}${requestPath}`, {
      ...requestOptions,
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}`, ...(requestOptions.headers || {}) },
    });
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  }, { apiUrl, token, path, options });
}

try {
  await login(adminEmail);

  await page.goto(`${baseUrl}/categories`);
  await page.getByRole('button', { name: 'Add Category' }).click();
  await modal().locator('input').nth(0).fill(names.category);
  await modal().locator('input').nth(1).fill(marker);
  await modal().getByRole('button', { name: 'Create Category' }).click();
  await page.getByText(names.category, { exact: true }).waitFor();

  await page.goto(`${baseUrl}/subcategories`);
  await page.getByRole('button', { name: 'Add Sub-Category' }).click();
  await modal().locator('input').nth(0).fill(names.subcategory);
  await modal().locator('input').nth(1).fill(`${marker}-sub`);
  await modal().locator('select').nth(0).selectOption({ label: names.category });
  await modal().getByRole('button', { name: 'Create Sub-Category' }).click();
  await page.getByText(names.subcategory, { exact: true }).waitFor();
  await page.reload();
  assert.match(await rowFor(names.subcategory).innerText(), new RegExp(names.category));

  await page.goto(`${baseUrl}/areas`);
  await page.getByRole('button', { name: 'Add Area' }).click();
  await modal().locator('input').nth(0).fill(names.area);
  await modal().locator('input').nth(1).fill(`${marker}-area`);
  await modal().getByRole('button', { name: 'Create Area' }).click();
  await page.getByText(names.area, { exact: true }).waitFor();

  await page.goto(`${baseUrl}/reporters`);
  await page.getByRole('button', { name: 'Add Reporter' }).click();
  await field('Full Name').locator('input').fill(names.reporter);
  await field('Email').locator('input').fill(`${marker}@reporter.kkn.test`);
  await field('Designation').locator('input').fill('Smoke Reporter');
  await modal().getByRole('button', { name: 'Add Reporter' }).click();
  await page.getByText(names.reporter, { exact: true }).waitFor();

  await page.goto(`${baseUrl}/media`);
  await page.locator('input[type="file"]').setInputFiles(imagePath);
  await page.getByText(`${marker}.png`, { exact: true }).waitFor();

  await page.goto(`${baseUrl}/news/add`);
  await field('News Title').locator('input').fill(names.article);
  await field('Tamil Title').locator('input').fill('படி மூன்று செய்தி');
  await field('Short Description').locator('textarea').fill('Step 3 server-backed excerpt');
  await field('Tamil Short Description').locator('textarea').fill('படி மூன்று சுருக்கம்');
  await field('Full News Content').locator('textarea').fill('<p>Step 3 server-backed content.</p>');
  await field('Tamil Content').locator('textarea').fill('<p>படி மூன்று உள்ளடக்கம்.</p>');
  await field('Featured Image').locator('select').selectOption({ label: `${marker}.png` });
  await field('Tags').locator('input').fill('SmokeTag');
  await field('Tags').locator('input').press('Enter');
  await field('Category').locator('select').selectOption({ label: names.category });
  await field('Sub Category').locator('select').selectOption({ label: names.subcategory });
  await field('Author / Reporter').locator('select').selectOption({ label: names.reporter });
  await field('Area').locator('select').selectOption({ label: names.area });
  await field('Location').locator('input').fill('Nagercoil');
  for (const label of ['Mark as Breaking News', 'Mark as Featured']) {
    await page.getByText(label, { exact: true }).locator('..').locator('label.switch').click();
  }
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForURL('**/news');
  await page.goto(`${baseUrl}/news/drafts`);
  await rowFor(names.article).waitFor();

  await rowFor(names.article).getByTitle('Edit').click();
  await field('News Title').locator('input').waitFor();
  assert.equal(await field('Tamil Title').locator('input').inputValue(), 'படி மூன்று செய்தி');
  assert.equal(await field('Tamil Content').locator('textarea').inputValue(), '<p>படி மூன்று உள்ளடக்கம்.</p>');
  await field('Short Description').locator('textarea').fill('Step 3 edited server-backed excerpt');
  await page.getByRole('button', { name: 'Submit for Review' }).click();
  await page.waitForURL('**/news');

  await page.goto(`${baseUrl}/news/pending`);
  await rowFor(names.article).getByRole('button', { name: 'Approve' }).click();
  await page.goto(`${baseUrl}/news/published`);
  await rowFor(names.article).waitFor();

  await rowFor(names.article).getByRole('button', { name: 'Unpublish' }).click();
  await page.goto(`${baseUrl}/news/drafts`);
  await rowFor(names.article).getByRole('button', { name: 'Submit' }).click();
  await page.goto(`${baseUrl}/news/pending`);
  await rowFor(names.article).getByRole('button', { name: 'Reject' }).click();
  await modal().locator('textarea').fill('Add one more verified source.');
  await modal().getByRole('button', { name: 'Reject & Return to Draft' }).click();
  await page.goto(`${baseUrl}/news/drafts`);
  await rowFor(names.article).getByRole('button', { name: 'Publish Now' }).click();
  await page.goto(`${baseUrl}/news/published`);
  await rowFor(names.article).waitFor();

  const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto(`${baseUrl}/news/add`);
  await field('News Title').locator('input').fill(names.scheduledArticle);
  await field('Short Description').locator('textarea').fill('Scheduled smoke excerpt');
  await field('Full News Content').locator('textarea').fill('<p>Scheduled smoke content.</p>');
  await field('Category').locator('select').selectOption({ label: names.category });
  await field('Author / Reporter').locator('select').selectOption({ label: names.reporter });
  await field('Publish Date').locator('input').fill(futureDate);
  await field('Publish Time').locator('input').fill('23:45');
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.waitForURL('**/news');
  await page.goto(`${baseUrl}/news/scheduled`);
  await rowFor(names.scheduledArticle).waitFor();
  await rowFor(names.scheduledArticle).getByTitle('Edit').click();
  await field('Publish Time').locator('input').fill('23:50');
  await page.getByRole('button', { name: 'Update Schedule' }).click();
  await page.waitForURL('**/news');
  await page.goto(`${baseUrl}/news/scheduled`);
  await rowFor(names.scheduledArticle).getByRole('button', { name: 'Cancel Schedule' }).click();
  await page.goto(`${baseUrl}/news/drafts`);
  await rowFor(names.scheduledArticle).getByTitle('Delete').click();
  await modal().getByRole('button', { name: 'Delete' }).click();
  await rowFor(names.scheduledArticle).waitFor({ state: 'detached' });

  await page.locator('.nav-item', { hasText: 'Logout' }).click();
  await login(restrictedEmail);
  assert.equal(await page.getByText('Users & Roles', { exact: true }).count(), 0);
  await page.goto(`${baseUrl}/users-roles`);
  await page.getByText(/403 — Access Denied/).waitFor();
  const restrictedToken = await apiSession(restrictedEmail);
  const forbidden = await apiRequest(restrictedToken, '/api/admin/categories', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Forbidden ${marker}` }),
  });
  assert.equal(forbidden.status, 403);
  const stillActive = await apiRequest(restrictedToken, '/api/admin/auth/me');
  assert.equal(stillActive.status, 200);

  const adminToken = await apiSession(adminEmail);
  const articleList = await apiRequest(adminToken, `/api/admin/news?search=${encodeURIComponent(names.article)}&limit=20`);
  const article = articleList.payload.data.items.find((item) => item.title === names.article);
  assert.ok(article);
  assert.equal(article.status, 'published');
  assert.equal(article.shortDescription, 'Step 3 edited server-backed excerpt');
  assert.deepEqual(article.tags, ['smoketag']);
  assert.equal(article.isFeatured, true);
  assert.equal(article.isBreaking, true);
  assert.equal(article.titleTA, 'படி மூன்று செய்தி');
  assert.ok(article.categoryId && article.subcategoryId && article.authorId && article.areaId && article.featuredImageId);

  await apiRequest(adminToken, `/api/admin/news/${article.id}`, { method: 'DELETE' });
  const [subcategories, categories, areas, reporters, media] = await Promise.all([
    apiRequest(adminToken, '/api/admin/subcategories'), apiRequest(adminToken, '/api/admin/categories'),
    apiRequest(adminToken, '/api/admin/areas'), apiRequest(adminToken, '/api/admin/reporters'),
    apiRequest(adminToken, `/api/admin/media?q=${encodeURIComponent(marker)}&kind=image`),
  ]);
  const subcategory = subcategories.payload.data.find((item) => item.name === names.subcategory);
  const category = categories.payload.data.find((item) => item.name === names.category);
  const area = areas.payload.data.find((item) => item.name === names.area);
  const reporter = reporters.payload.data.find((item) => item.name === names.reporter);
  const mediaItem = media.payload.data.items.find((item) => item.name === `${marker}.png`);
  for (const [path, id] of [['/api/admin/subcategories', subcategory?.id], ['/api/admin/categories', category?.id], ['/api/admin/areas', area?.id], ['/api/admin/reporters', reporter?.id], ['/api/admin/media', mediaItem?.id]]) {
    if (id) assert.equal((await apiRequest(adminToken, `${path}/${id}`, { method: 'DELETE' })).status, 200);
  }

  assert.deepEqual(browserErrors, []);
  console.log(JSON.stringify({
    result: 'passed',
    uiFlow: ['login', 'category', 'subcategory', 'area', 'reporter', 'media-upload', 'draft', 'edit-roundtrip', 'submit', 'approve', 'unpublish', 'reject', 'publish-now', 'schedule', 'reschedule', 'cancel-schedule', 'delete'],
    restricted403: true,
    sessionAfter403: true,
    fixturesCleaned: true,
  }));
} finally {
  await browser.close();
  await rm(tempDir, { recursive: true, force: true });
}
