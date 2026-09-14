import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const root = process.cwd();
const src = (path) => readFileSync(join(root, path), 'utf8');

describe('ContactUs is backend-authoritative (localStorage removed)', () => {
  const contactUs = src('src/pages/ContactUs.jsx');

  it('loads settings through the settings API on mount', () => {
    assert.match(contactUs, /settingsApi\.get\(\)/);
    assert.match(contactUs, /normalizeContactInfo\(data\?\.contactInfo\)/);
    assert.match(contactUs, /useEffect\(\(\) => \{ load\(\); \}, \[load\]\)/);
  });

  it('saves only the contactInfo block (partial update semantics)', () => {
    assert.match(contactUs, /settingsApi\.update\(\{ contactInfo: buildContactInfoPayload\(form\) \}\)/);
  });

  it('no longer reads or writes the contact_info localStorage key', () => {
    assert.doesNotMatch(contactUs, /loadData\(/);
    assert.doesNotMatch(contactUs, /saveData\(/);
    // The only remaining mention of the legacy key is the dev-only notice.
    const legacyMentions = contactUs.split('dw_admin_contact_info').length - 1;
    assert.equal(legacyMentions, 1, 'legacy key may only appear in the dev console notice');
    assert.doesNotMatch(contactUs, /localStorage\.setItem\(.*dw_admin_contact_info/);
    assert.doesNotMatch(contactUs, /localStorage\.removeItem/);
  });

  it('has a loading gate, load-error retry, and save state', () => {
    assert.match(contactUs, /setLoading\(true\)/);
    assert.match(contactUs, /setLoadError\(error\?\.message/);
    assert.match(contactUs, /Loading contact settings/);
    assert.match(contactUs, /Unable to load contact settings/);
    assert.match(contactUs, /onClick=\{load\}>\s*Retry\s*</);
    assert.match(contactUs, /setSaving\(true\)/);
    assert.match(contactUs, /setSaving\(false\)/);
  });

  it('validates email, website URL, and Google Maps embed client-side', () => {
    assert.match(contactUs, /u\.protocol !== 'https:'/);
    assert.match(contactUs, /host !== 'google\.com' && !host\.endsWith\('\.google\.com'\)/);
    assert.match(contactUs, new RegExp("u\\.pathname\\.startsWith\\('/maps/'\\)"));
    assert.match(contactUs, /u\.hostname\.toLowerCase\(\)/);
    assert.match(contactUs, /Enter a valid email address/);
    assert.match(contactUs, /Enter a valid URL/);
  });

  it('maps backend 400 field details onto form fields and keeps unsaved values', () => {
    assert.match(contactUs, /error\?\.status === 400 && Array\.isArray\(error\.details\)/);
    assert.match(contactUs, /startsWith\('contactInfo\.'\)/);
    assert.match(contactUs, /detail\.message/);
  });

  it('gates save and inputs on settings.edit (view-only stays read-only)', () => {
    assert.match(contactUs, /hasPermission\('settings\.edit'\)/);
    assert.match(contactUs, /actions=\{canEdit \?/);
    assert.match(contactUs, /disabled=\{disabled\}/);
    assert.match(contactUs, /const disabled = !canEdit \|\| saving;/);
  });

  it('renders the map iframe preview from the live form value', () => {
    assert.match(contactUs, /\{form\.mapEmbedUrl && \(/);
    assert.match(contactUs, /<iframe[\s\S]*?src=\{form\.mapEmbedUrl\}/);
  });

  it('does not call useAutoRefresh (editable form, no destructive polling)', () => {
    assert.doesNotMatch(contactUs, /useAutoRefresh/);
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
      'src/pages/Advertisements.jsx', 'src/pages/UsersRoles.jsx',
    ]) {
      assert.match(src(file), /useAutoRefresh\(/, `${file} must keep useAutoRefresh`);
    }
    for (const file of ['src/pages/ContactUs.jsx', 'src/pages/Settings.jsx']) {
      assert.doesNotMatch(src(file), /useAutoRefresh\(/, `${file} must NOT auto-overwrite an editable form`);
    }
  });
});
