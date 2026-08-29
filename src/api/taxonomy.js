import { apiClient } from './client.js';

function crud(client, path) {
  return {
    list: (filters = {}, options = {}) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
      }
      const query = params.toString();
      return client.request(`${path}${query ? `?${query}` : ''}`, options);
    },
    create: (payload) => client.request(path, { method: 'POST', body: payload }),
    update: (id, payload) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
    remove: (id) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export function createTaxonomyApi(client = apiClient) {
  return {
    categories: crud(client, '/api/admin/categories'),
    subcategories: crud(client, '/api/admin/subcategories'),
    areas: crud(client, '/api/admin/areas'),
  };
}

export const taxonomyApi = createTaxonomyApi();
