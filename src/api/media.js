import { apiClient } from './client.js';

function mediaQuery(filters = {}) {
  const params = new URLSearchParams();
  for (const key of ['q', 'kind', 'page', 'limit']) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function createMediaApi(client = apiClient) {
  return {
    list: (filters) => client.request(`/api/admin/media${mediaQuery(filters)}`),
    upload: (file, kind) => {
      const body = new FormData();
      body.append('file', file);
      if (kind) body.append('kind', kind);
      return client.request('/api/admin/upload', { method: 'POST', body });
    },
    remove: (id) => client.request(`/api/admin/media/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export const mediaApi = createMediaApi();
