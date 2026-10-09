import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const root = process.cwd();
const src = (path) => readFileSync(join(root, path), 'utf8');

describe('ContactUs manages backend contact submissions', () => {
  const contactUs = src('src/pages/ContactUs.jsx');
  const contactApi = src('src/api/contact.js');

  it('loads contact submissions on mount and during auto-refresh', () => {
    assert.match(contactUs, /contactApi\.list\(\{ page: 1, limit: 100 \}\)/);
    assert.match(contactUs, /setEnquiries\(data\.items \|\| \[\]\)/);
    assert.match(contactUs, /useEffect\(\(\) => \{ loadEnquiries\(\); \}, \[loadEnquiries\]\)/);
    assert.match(contactUs, /useAutoRefresh\(loadEnquiries\)/);
  });

  it('updates status and deletes submissions through the contact API', () => {
    assert.match(contactUs, /contactApi\.updateStatus\(id, status\)/);
    assert.match(contactUs, /contactApi\.remove\(id\)/);
    assert.match(contactUs, /setEnquiries\(\(prev\) => prev\.map/);
    assert.match(contactUs, /setEnquiries\(\(prev\) => prev\.filter/);
  });

  it('falls back to clearly identified sample data when loading fails', () => {
    assert.match(contactUs, /setLoadError\(error\?\.message/);
    assert.match(contactUs, /contactApi\.mockEnquiries\(\)/);
    assert.match(contactUs, /setMockMode\(true\)/);
    assert.match(contactUs, /Showing sample enquiries/);
    assert.match(contactUs, /onClick=\{loadEnquiries\}/);
  });

  it('uses the backend contact-submission endpoints', () => {
    assert.match(contactApi, /\/api\/admin\/contact-submissions/);
    assert.match(contactApi, /\/status`/);
    assert.match(contactApi, /method: 'PUT'/);
    assert.match(contactApi, /method: 'DELETE'/);
  });

  it('renders loading, filtering, and submission detail states', () => {
    assert.match(contactUs, /Loading enquiries/);
    assert.match(contactUs, /enqFilter/);
    assert.match(contactUs, /enqSearch/);
    assert.match(contactUs, /selectedEnq/);
    assert.match(contactUs, /Mark as Replied/);
  });
});

describe('Settings is backend-authoritative (localStorage removed)', () => {
  const settings = src('src/pages/Settings.jsx');

  it('loads and saves through the settings API', () => {
    assert.match(settings, /settingsApi\.get\(\)/);
    assert.match(settings, /normalizeSettings\(data\)/);
    assert.match(settings, /settingsApi\.update\(buildSettingsPayload\(settings\)\)/);
    // Returned server state is trusted after save (not local form state).
    assert.match(settings, /setSettings\(normalizeSettings\(updated\)\)/);
  });

  it('no longer reads or writes the settings localStorage key as authoritative data', () => {
    assert.doesNotMatch(settings, /loadData\(/);
    assert.doesNotMatch(settings, /saveData\(/);
    const legacyMentions = settings.split('dw_admin_settings').length - 1;
    assert.equal(legacyMentions, 1, 'legacy key may only appear in the dev console notice');
  });

  it('renders all seven social inputs', () => {
    for (const label of ['Facebook', 'X / Twitter', 'Instagram', 'YouTube', 'Telegram', 'WhatsApp', 'Google News']) {
      assert.match(settings, new RegExp(label), `missing social input: ${label}`);
    }
    assert.match(settings, /SOCIAL_KEYS\.map\(/);
  });

  it('uploads logo/favicon through the media API instead of base64 localStorage', () => {
    assert.match(settings, /mediaApi\.upload\(file, 'image'\)/);
    assert.match(settings, /\[key\]: media\.url, \[`\$\{key\}Id`\]: media\.id/);
    assert.doesNotMatch(settings, /readAsDataURL/);
  });

  it('gates save and inputs on settings.edit', () => {
    assert.match(settings, /hasPermission\('settings\.edit'\)/);
    assert.match(settings, /actions=\{canEdit \?/);
    assert.match(settings, /disabled=\{!canEdit\}/);
  });

  it('surfaces 403 and 400 failures distinctly and keeps unsaved values', () => {
    assert.match(settings, /error\?\.status === 403/);
    assert.match(settings, /error\?\.status === 400/);
    assert.match(settings, /settings\.edit required/);
  });

  it('does not call useAutoRefresh (editable form, no destructive polling)', () => {
    assert.doesNotMatch(settings, /useAutoRefresh/);
  });
});

describe('route and navigation permissions', () => {
  it('/contact-us is gated on settings.view (route + sidebar), not ads.view', () => {
    const app = src('src/App.jsx');
    assert.match(app, /path=["']contact-us["'][\s\S]*?protectedPage\('settings\.view', <ContactUs \/>/);
    assert.doesNotMatch(app, /contact-us["'][\s\S]*?protectedPage\('ads\.view'/);

    const sidebar = src('src/components/layout/Sidebar.jsx');
    assert.match(sidebar, /to: '\/contact-us'[\s\S]*?permission: 'settings\.view'/);
    assert.doesNotMatch(sidebar, /to: '\/contact-us'[\s\S]*?permission: 'ads\.view'/);
  });

  it('/settings remains gated on settings.view', () => {
    const app = src('src/App.jsx');
    assert.match(app, /path=["']settings["'][\s\S]*?protectedPage\('settings\.view', <Settings \/>/);
  });
});

describe('auto-refresh regression check', () => {
  it('list pages still opt into global auto-refresh; form pages do not', () => {
    for (const file of [
      'src/pages/NewsList.jsx', 'src/pages/Categories.jsx', 'src/pages/Reporters.jsx',
      'src/pages/Advertisements.jsx', 'src/pages/UsersRoles.jsx', 'src/pages/ContactUs.jsx',
    ]) {
      assert.match(src(file), /useAutoRefresh\(/, `${file} must keep useAutoRefresh`);
    }
    for (const file of ['src/pages/Settings.jsx']) {
      assert.doesNotMatch(src(file), /useAutoRefresh\(/, `${file} must NOT auto-overwrite an editable form`);
    }
  });
});
