import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONTACT_INFO_FIELDS,
  SOCIAL_FIELDS,
  SOCIAL_KEYS,
  buildContactInfoPayload,
  buildSettingsPayload,
  buildSocialPayload,
  createSettingsApi,
  normalizeContactInfo,
  normalizeSettings,
} from '../src/api/settings.js';

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

// ── API boundary ─────────────────────────────────────────────────────────────

test('settings API uses the flat admin settings contract', async () => {
  const client = recordingClient({ siteName: 'KTN' });
  const api = createSettingsApi(client);

  const loaded = await api.get();
  await api.update({ socialTelegram: null });

  assert.deepEqual(loaded, { siteName: 'KTN' });
  assert.deepEqual(client.calls, [
    ['/api/admin/settings', {}],
    ['/api/admin/settings', { method: 'PUT', body: { socialTelegram: null } }],
  ]);
});

// ── contactInfo normalization (ContactUs load) ───────────────────────────────

test('contactInfo fields match the backend strict whitelist exactly', () => {
  assert.deepEqual(CONTACT_INFO_FIELDS, [
    'officeName', 'address', 'city', 'state', 'pincode', 'phone', 'altPhone',
    'email', 'supportEmail', 'website', 'mapEmbedUrl', 'whatsapp', 'workingHours',
  ]);
});

test('stored contactInfo populates the form (string values, unknown keys dropped)', () => {
  const stored = {
    officeName: 'Kanyakumari Today',
    address: '1 Beach Rd',
    city: 'Kanyakumari',
    state: 'Tamil Nadu',
    pincode: '629001',
    phone: '+91 94440 11111',
    altPhone: null, // null -> default ''
    email: 'info@kanyakumartoday.com',
    supportEmail: '', // blank -> ''
    website: 'https://kanyakumartoday.com',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=qa',
    whatsapp: '+91 94440 22222',
    workingHours: null, // null -> UI default
    strayKey: 'ignored',
  };
  const form = normalizeContactInfo(stored);

  assert.equal(form.officeName, 'Kanyakumari Today');
  assert.equal(form.email, 'info@kanyakumartoday.com');
  assert.equal(form.altPhone, '');
  assert.equal(form.supportEmail, '');
  assert.equal(form.workingHours, 'Mon – Sat: 9:00 AM – 6:00 PM');
  assert.equal('strayKey' in form, false);
});

test('null/missing contactInfo yields empty default form (no record creation)', () => {
  const form = normalizeContactInfo(null);
  for (const key of CONTACT_INFO_FIELDS) {
    assert.equal(typeof form[key], 'string', `${key} must be a string`);
  }
  assert.equal(form.officeName, '');
  assert.equal(form.address, '');
  assert.equal(form.workingHours, 'Mon – Sat: 9:00 AM – 6:00 PM');
  assert.deepEqual(normalizeContactInfo(undefined), normalizeContactInfo(null));
});

// ── contactInfo payload (ContactUs save) ─────────────────────────────────────

test('contactInfo save payload sends all 13 keys with blanks as null', () => {
  const form = {
    officeName: '  Kanyakumari Today  ',
    address: '', // cleared field
    city: 'Kanyakumari',
    state: '',
    pincode: '',
    phone: '+91 94440 11111',
    altPhone: '',
    email: 'info@kanyakumartoday.com',
    supportEmail: '',
    website: '',
    mapEmbedUrl: '',
    whatsapp: '+91 94440 22222',
    workingHours: 'Mon – Sat: 9:00 AM – 6:00 PM',
  };
  const payload = buildContactInfoPayload(form);

  assert.deepEqual(Object.keys(payload).sort(), [...CONTACT_INFO_FIELDS].sort());
  assert.equal(payload.officeName, 'Kanyakumari Today'); // trimmed
  assert.equal(payload.address, null); // blank -> null (backend clears)
  assert.equal(payload.state, null);
  assert.equal(payload.mapEmbedUrl, null);
  assert.equal(payload.phone, '+91 94440 11111');
  assert.equal(payload.whatsapp, '+91 94440 22222');
});

// ── Settings normalization (Settings load) ───────────────────────────────────

function flatSettingsDto(overrides = {}) {
  return {
    id: 1,
    siteName: 'Kanyakumari Today',
    tagline: 'The South\'s Own Voice',
    logoId: 12,
    logo: 'http://106.51.20.225/uploads/2026/09/logo.png',
    faviconId: 13,
    favicon: 'http://106.51.20.225/uploads/2026/09/favicon.png',
    contactEmail: 'info@kanyakumartoday.com',
    contactPhone: '+91 94440 11111',
    address: 'Beach Road, Kanyakumari',
    headerNote: 'Election special inside',
    footerText: '© KTN',
    socialFacebook: 'https://facebook.com/kanyakumaritoday',
    socialTwitter: null,
    socialInstagram: 'https://instagram.com/kanyakumaritoday',
    socialYoutube: 'https://youtube.com/@kanyakumaritoday',
    socialTelegram: 'https://t.me/kanyakumaritoday',
    socialWhatsapp: 'https://wa.me/919444011111',
    socialGooglenews: 'https://news.google.com/publications/abc',
    contactInfo: null,
    updatedAt: '2026-09-14T00:00:00.000Z',
    ...overrides,
  };
}

test('settings DTO maps flat social fields onto the nested social object (all 7)', () => {
  const dto = flatSettingsDto();
  const settings = normalizeSettings(dto);

  assert.equal(settings.siteName, 'Kanyakumari Today');
  assert.equal(settings.logoUrl, dto.logo);
  assert.equal(settings.logoId, 12);
  assert.equal(settings.faviconUrl, dto.favicon);
  assert.equal(settings.faviconId, 13);
  assert.equal(settings.contactEmail, dto.contactEmail);
  assert.deepEqual(settings.social, {
    facebook: 'https://facebook.com/kanyakumaritoday',
    twitter: '',
    instagram: 'https://instagram.com/kanyakumaritoday',
    youtube: 'https://youtube.com/@kanyakumaritoday',
    telegram: 'https://t.me/kanyakumaritoday',
    whatsapp: 'https://wa.me/919444011111',
    googlenews: 'https://news.google.com/publications/abc',
  });
});

test('social field mapping preserves the backend field names', () => {
  assert.deepEqual(SOCIAL_FIELDS, [
    ['facebook', 'socialFacebook'],
    ['twitter', 'socialTwitter'],
    ['instagram', 'socialInstagram'],
    ['youtube', 'socialYoutube'],
    ['telegram', 'socialTelegram'],
    ['whatsapp', 'socialWhatsapp'],
    ['googlenews', 'socialGooglenews'],
  ]);
  assert.deepEqual(SOCIAL_KEYS, ['facebook', 'twitter', 'instagram', 'youtube', 'telegram', 'whatsapp', 'googlenews']);
});

test('missing/null settings row normalizes to an empty form', () => {
  const settings = normalizeSettings({});
  assert.equal(settings.siteName, '');
  assert.equal(settings.logoUrl, '');
  assert.equal(settings.logoId, null);
  assert.equal(settings.faviconId, null);
  for (const key of SOCIAL_KEYS) assert.equal(settings.social[key], '');
});

// ── Settings payload (Settings save) ─────────────────────────────────────────

test('settings save payload contains only backend-supported fields with backend names', () => {
  const settings = normalizeSettings(flatSettingsDto());
  settings.social.twitter = ' https://x.com/kanyakumaritoday ';
  settings.tagline = '';
  settings.logoId = null;
  settings.logoUrl = '';
  settings.faviconId = null;
  settings.faviconUrl = '';

  const payload = buildSettingsPayload(settings);

  const allowed = new Set([
    'siteName', 'tagline', 'logoId', 'faviconId',
    'contactEmail', 'contactPhone', 'address', 'headerNote', 'footerText',
    ...SOCIAL_FIELDS.map(([, apiKey]) => apiKey),
  ]);
  for (const key of Object.keys(payload)) {
    assert.ok(allowed.has(key), `unexpected field in payload: ${key}`);
  }

  assert.equal(payload.siteName, 'Kanyakumari Today');
  assert.equal(payload.tagline, null); // blank optional -> null
  assert.equal(payload.logoId, null); // cleared logo
  assert.equal(payload.faviconId, null);
  assert.equal(payload.contactEmail, 'info@kanyakumartoday.com');
  assert.equal(payload.socialFacebook, 'https://facebook.com/kanyakumaritoday');
  assert.equal(payload.socialTwitter, 'https://x.com/kanyakumaritoday'); // trimmed
  assert.equal(payload.socialTelegram, 'https://t.me/kanyakumaritoday');
  assert.equal(payload.socialWhatsapp, 'https://wa.me/919444011111');
  assert.equal(payload.socialGooglenews, 'https://news.google.com/publications/abc');
  // No nested social object, no logoUrl string, no contactInfo, no UI junk.
  assert.equal('social' in payload, false);
  assert.equal('logoUrl' in payload, false);
  assert.equal('contactInfo' in payload, false);
});

test('social payload sends blanked networks as null so the backend clears them', () => {
  const settings = normalizeSettings(flatSettingsDto());
  settings.social.telegram = '   ';
  const payload = buildSocialPayload(settings);
  assert.equal(payload.socialTelegram, null);
  assert.equal(payload.socialFacebook, 'https://facebook.com/kanyakumaritoday');
});
