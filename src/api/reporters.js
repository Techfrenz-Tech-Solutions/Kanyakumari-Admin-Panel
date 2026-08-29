import { apiClient } from './client.js';

export function createReportersApi(client = apiClient) {
  const path = '/api/admin/reporters';
  return {
    list: (filters = {}) => {
      const query = filters.status ? `?status=${encodeURIComponent(filters.status)}` : '';
      return client.request(`${path}${query}`);
    },
    get: (id) => client.request(`${path}/${encodeURIComponent(id)}`),
    create: (payload) => client.request(path, { method: 'POST', body: payload }),
    update: (id, payload) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
    remove: (id) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export const reportersApi = createReportersApi();
