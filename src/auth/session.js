export async function restoreSession(authApi) {
  const refreshed = await authApi.refresh();
  const current = await authApi.me();
  return { accessToken: refreshed.accessToken, user: current.user };
}

// React StrictMode replays mount effects. Claiming the effect once prevents
// duplicate rotating refresh calls from consuming the refresh rate limit.
export function claimSessionBootstrap(gate) {
  if (gate.current) return false;
  gate.current = true;
  return true;
}

export function authenticationDecision({ isInitializing, isAuthenticated }) {
  if (isInitializing) return 'initializing';
  return isAuthenticated ? 'allow' : 'login';
}

export function permissionDecision({ hasPermission, permission }) {
  return hasPermission(permission) ? 'allow' : 'denied';
}

export async function changePasswordAndEndSession(authApi, logout, currentPassword, newPassword) {
  await authApi.changePassword(currentPassword, newPassword);
  await logout();
}
