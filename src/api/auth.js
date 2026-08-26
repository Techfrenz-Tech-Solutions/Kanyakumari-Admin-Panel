import { apiClient } from './client.js';

export function createAuthApi(client) {
  return {
    async login(email, password) {
      const data = await client.request('/api/admin/auth/login', {
        method: 'POST', body: { email, password }, includeAuth: false, retryAuth: false,
      });
      client.setAccessToken(data.accessToken);
      return data;
    },
    refresh: () => client.refreshSession(),
    me: () => client.request('/api/admin/auth/me'),
    logout: () => client.request('/api/admin/auth/logout', {
      method: 'POST', body: {}, retryAuth: false,
    }),
    forgotPassword: (email) => client.request('/api/admin/auth/forgot-password', {
      method: 'POST', body: { email }, includeAuth: false, retryAuth: false,
    }),
    resetPassword: (token, newPassword) => client.request('/api/admin/auth/reset-password', {
      method: 'POST', body: { token, newPassword }, includeAuth: false, retryAuth: false,
    }),
    updateProfile: (profile) => client.request('/api/admin/auth/profile', {
      method: 'PUT', body: profile,
    }),
    changePassword: (currentPassword, newPassword) => client.request('/api/admin/auth/password', {
      method: 'PUT', body: { currentPassword, newPassword },
    }),
  };
}

export const authApi = createAuthApi(apiClient);
