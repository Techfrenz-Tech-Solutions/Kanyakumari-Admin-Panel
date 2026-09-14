import { apiClient } from './client.js';

/**
 * Site settings endpoints (Backend supporting.settings).
 *   GET /api/admin/settings  -> settings.view
 *   PUT /api/admin/settings  -> settings.edit
 *
 * The backend returns and accepts a FLAT settings DTO. Social links are flat
 * `social*` fields on the settings object (not a nested `social` object), and
 * the ContactUs office form lives under the nested `contactInfo` (13-key
 * strict whitelist; sending `contactInfo: null` clears the stored object,
 * omitted keys are left untouched — partial update semantics).
 */

// The backend contactInfo strict whitelist (Kanyakumari-News-Backend
// src/routes/admin/supporting.js -> contactInfoSchema). Keys outside this
// list are rejected with a 400 VALIDATION_ERROR.
export const CONTACT_INFO_FIELDS = [
  'officeName', 'address', 'city', 'state', 'pincode', 'phone', 'altPhone',
  'email', 'supportEmail', 'website', 'mapEmbedUrl', 'whatsapp', 'workingHours',
];

// [UI local key (nested `social` object), backend flat field name]
export const SOCIAL_FIELDS = [
  ['facebook', 'socialFacebook'],
  ['twitter', 'socialTwitter'],
  ['instagram', 'socialInstagram'],
  ['youtube', 'socialYoutube'],
  ['telegram', 'socialTelegram'],
  ['whatsapp', 'socialWhatsapp'],
  ['googlenews', 'socialGooglenews'],
];

export const SOCIAL_KEYS = SOCIAL_FIELDS.map(([localKey]) => localKey);

const DEFAULT_CONTACT_INFO = {
  officeName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  altPhone: '',
  email: '',
  supportEmail: '',
  website: '',
  mapEmbedUrl: '',
  whatsapp: '',
  workingHours: 'Mon – Sat: 9:00 AM – 6:00 PM',
};

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

/**
 * Merge a backend `contactInfo` (null when never saved) with form defaults so
 * the form always holds string values. Null/empty stored values fall back to
 * the field default (only workingHours has a non-empty default).
 */
export function normalizeContactInfo(stored) {
  const base = { ...DEFAULT_CONTACT_INFO };
  if (!stored || typeof stored !== 'object') return base;
  for (const key of CONTACT_INFO_FIELDS) {
    const value = stored[key];
    base[key] = isBlank(value) ? base[key] : String(value);
  }
  return base;
}

/**
 * Map a flat backend settings DTO onto the Settings page shape (flat fields +
 * nested `social` object). Empty social links become '' for the inputs.
 */
export function normalizeSettings(stored = {}) {
  const social = {};
  for (const [localKey, apiKey] of SOCIAL_FIELDS) {
    const value = stored[apiKey];
    social[localKey] = isBlank(value) ? '' : String(value);
  }
  return {
    siteName: stored.siteName || '',
    tagline: stored.tagline ?? '',
    logoUrl: stored.logo || '',
    logoId: stored.logoId ?? null,
    faviconUrl: stored.favicon || '',
    faviconId: stored.faviconId ?? null,
    contactEmail: stored.contactEmail ?? '',
    contactPhone: stored.contactPhone ?? '',
    address: stored.address ?? '',
    headerNote: stored.headerNote ?? '',
    footerText: stored.footerText ?? '',
    social,
    updatedAt: stored.updatedAt ?? null,
  };
}

/**
 * Build the `contactInfo` payload for PUT /api/admin/settings.
 *
 * Decision D2 (empty string vs null): the backend treats `null` as the
 * "cleared" state and has no per-key delete semantics for the JSON object, so
 * empty optional fields are sent as `null` — clearing a field in the UI
 * actually clears it on the server. The full 13-key object is always sent
 * (never `contactInfo: null`) so the stored shape stays complete.
 */
export function buildContactInfoPayload(form) {
  const payload = {};
  for (const key of CONTACT_INFO_FIELDS) {
    const value = String(form[key] ?? '').trim();
    payload[key] = value === '' ? null : value;
  }
  return payload;
}

/**
 * Build the flat social payload for PUT /api/admin/settings.
 * Decision D2 continued: backend social URL fields are `z.string().url()`,
 * so blanked values are sent as `null` (which the backend clears) rather
 * than '' — which would fail URL validation on an explicit save.
 */
export function buildSocialPayload(settings) {
  const payload = {};
  for (const [localKey, apiKey] of SOCIAL_FIELDS) {
    const value = String(settings.social?.[localKey] ?? '').trim();
    payload[apiKey] = value === '' ? null : value;
  }
  return payload;
}

/**
 * Build the flat site-settings payload for PUT /api/admin/settings.
 * Only backend-supported fields are included (never the whole browser-local
 * object). Logo/favicon are identified by their media IDs — file uploads are
 * resolved to media rows before save, so a removed logo sends `null` to
 * clear it server-side.
 */
export function buildSettingsPayload(settings) {
  const payload = {
    siteName: String(settings.siteName ?? '').trim(),
    tagline: String(settings.tagline ?? '').trim() || null,
    logoId: settings.logoId ?? null,
    faviconId: settings.faviconId ?? null,
    contactEmail: String(settings.contactEmail ?? '').trim() || null,
    contactPhone: String(settings.contactPhone ?? '').trim() || null,
    address: String(settings.address ?? '').trim() || null,
    headerNote: String(settings.headerNote ?? '').trim() || null,
    footerText: String(settings.footerText ?? '').trim() || null,
  };
  Object.assign(payload, buildSocialPayload(settings));
  return payload;
}

export function createSettingsApi(client = apiClient) {
  return {
    get: () => client.request('/api/admin/settings', {}),
    update: (payload) => client.request('/api/admin/settings', { method: 'PUT', body: payload }),
  };
}

export const settingsApi = createSettingsApi();
