import { apiClient } from './client.js';

const asDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const clean = (payload) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined)
);

const normalizeJob = (job = {}) => ({
  ...job,
  org: job.org || '',
  location: job.location || '',
  type: job.type || 'private',
  lastDate: asDateInput(job.lastDate),
  applyUrl: job.applyUrl || '',
  status: job.status || 'active',
  createdAt: asDateInput(job.createdAt),
});

const normalizeJobPayload = (form = {}) => clean({
  title: form.title?.trim(),
  org: form.org?.trim() || null,
  location: form.location?.trim() || null,
  type: form.type || 'private',
  lastDate: form.lastDate,
  applyUrl: form.applyUrl?.trim() || null,
  status: form.status || 'active',
});

const normalizeAttraction = (place = {}) => ({
  ...place,
  description: place.description || '',
  photo: place.imageUrl || place.image?.url || place.photo || '',
  imageId: place.imageId ?? place.image?.id ?? null,
  category: place.category || '',
  timings: place.timings || '',
  entryFee: place.entryFee || '',
  status: place.status || 'active',
  sortOrder: place.sortOrder ?? 0,
  createdAt: asDateInput(place.createdAt),
});

const normalizeAttractionPayload = (form = {}) => clean({
  name: form.name?.trim(),
  description: form.description?.trim() || null,
  imageId: form.imageId || null,
  category: form.category?.trim() || null,
  timings: form.timings?.trim() || null,
  entryFee: form.entryFee?.trim() || null,
  status: form.status || 'active',
  sortOrder: Number(form.sortOrder) || 0,
});

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function createSupportingApi(client = apiClient) {
  return {
    jobs: {
      async list(filters = {}, options = {}) {
        const result = await client.request(`/api/admin/jobs${buildQuery(filters)}`, options);
        return { ...result, items: (result.items || []).map(normalizeJob) };
      },
      async create(payload, options = {}) {
        return normalizeJob(await client.request('/api/admin/jobs', { ...options, method: 'POST', body: normalizeJobPayload(payload) }));
      },
      async update(id, payload, options = {}) {
        return normalizeJob(await client.request(`/api/admin/jobs/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: normalizeJobPayload(payload) }));
      },
      remove: (id, options = {}) => client.request(`/api/admin/jobs/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }),
    },
    attractions: {
      async list(filters = {}, options = {}) {
        const result = await client.request(`/api/admin/attractions${buildQuery(filters)}`, options);
        return (Array.isArray(result) ? result : []).map(normalizeAttraction);
      },
      async create(payload, options = {}) {
        return normalizeAttraction(await client.request('/api/admin/attractions', { ...options, method: 'POST', body: normalizeAttractionPayload(payload) }));
      },
      async update(id, payload, options = {}) {
        return normalizeAttraction(await client.request(`/api/admin/attractions/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: normalizeAttractionPayload(payload) }));
      },
      remove: (id, options = {}) => client.request(`/api/admin/attractions/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }),
    },
  };
}

export const supportingApi = createSupportingApi();
