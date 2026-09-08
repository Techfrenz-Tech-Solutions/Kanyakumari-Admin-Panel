import { apiClient } from './client.js';

const POSITION_TO_API = {
  'Header Banner': 'leaderboard',
  Sidebar: 'rectangle',
  'In-Article': 'inline',
  'Footer Banner': 'footer',
  Popup: 'popup',
};

const POSITION_FROM_API = Object.fromEntries(Object.entries(POSITION_TO_API).map(([label, value]) => [value, label]));

const normalizeAd = (ad = {}) => ({
  ...ad,
  position: POSITION_FROM_API[ad.position] || ad.position || 'Header Banner',
  image: ad.imageUrl || ad.image?.url || ad.image || '',
  imageId: ad.imageId || ad.image?.id || null,
  startDate: ad.startDate ? String(ad.startDate).slice(0, 10) : '',
  endDate: ad.endDate ? String(ad.endDate).slice(0, 10) : '',
  impressions: ad.impressions || 0,
  clicks: ad.clicks || 0,
});

const normalizePayload = (payload = {}) => ({
  title: payload.title,
  description: payload.description || null,
  imageId: payload.imageId || null,
  position: POSITION_TO_API[payload.position] || payload.position || 'leaderboard',
  linkUrl: payload.linkUrl || null,
  startDate: payload.startDate,
  endDate: payload.endDate,
  status: payload.status || 'active',
});

export function createAdsApi(client = apiClient) {
  return {
    async list(filters = {}, options = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
      }
      const query = params.toString();
      const result = await client.request(`/api/admin/ads${query ? `?${query}` : ''}`, options);
      return { ...result, items: (result.items || []).map(normalizeAd) };
    },
    async create(payload, options = {}) {
      return normalizeAd(await client.request('/api/admin/ads', { ...options, method: 'POST', body: normalizePayload(payload) }));
    },
    async update(id, payload, options = {}) {
      return normalizeAd(await client.request(`/api/admin/ads/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: normalizePayload(payload) }));
    },
    remove: (id, options = {}) => client.request(`/api/admin/ads/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }),
  };
}

export const adsApi = createAdsApi();
