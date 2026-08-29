import { apiClient } from './client.js';

/**
 * Roles available for admin-panel accounts. Mirrors the backend
 * `roleEnum` in src/validators/team.schema.js (Kanyakumari-News-Backend).
 * There is no /api/admin/roles endpoint, so the list is local.
 */
export const USER_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'advertisement_manager', label: 'Advertisement Manager' },
];

export const roleLabel = (role) => USER_ROLES.find((item) => item.value === role)?.label || role;

function normalizePayload(payload = {}) {
  const next = { ...payload };
  if (next.password !== undefined && !next.password) delete next.password;
  if (next.extraPermissions !== undefined && !next.extraPermissions) next.extraPermissions = null;
  return next;
}

export function createUsersApi(client = apiClient) {
  const path = '/api/admin/users';
  return {
    list: (params = {}) => {
      const query = params.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return client.request(`${path}${query}`);
    },
    create: (payload) => client.request(path, { method: 'POST', body: normalizePayload(payload) }),
    update: (id, payload) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'PUT', body: normalizePayload(payload) }),
    remove: (id) => client.request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export const usersApi = createUsersApi();
