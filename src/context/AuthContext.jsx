import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../api/client.js';
import { authApi } from '../api/auth.js';
import { changePasswordAndEndSession, claimSessionBootstrap, restoreSession } from '../auth/session.js';
import {
  hasPermission as userHasPermission,
  hasAnyPermission as userHasAnyPermission,
  hasRole as userHasRole,
} from '../auth/permissions.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [authState, setAuthState] = useState('initializing');
  const sessionBootstrapGate = useRef(false);

  const clearLocalSession = useCallback(() => {
    apiClient.clearSession();
    setAccessTokenState(null);
    setUser(null);
    setAuthState('unauthenticated');
  }, []);

  const applySession = useCallback((data) => {
    if (!data?.accessToken || !data?.user) return;
    apiClient.setAccessToken(data.accessToken);
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    setAuthState('authenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    const session = await restoreSession(authApi);
    applySession(session);
    return session;
  }, [applySession]);

  useEffect(() => {
    if (!claimSessionBootstrap(sessionBootstrapGate)) return undefined;
    localStorage.removeItem('dw_session');
    const removeHandlers = apiClient.setSessionHandlers({
      onSessionRefreshed: applySession,
      onSessionExpired: clearLocalSession,
    });
    refreshSession().catch(() => clearLocalSession());
    return removeHandlers;
  }, [applySession, clearLocalSession, refreshSession]);

  const login = useCallback(async (email, password) => {
    const session = await authApi.login(email, password);
    applySession(session);
    return session.user;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn('[auth] logout request failed; local session cleared', error.code || error.message);
      }
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const updateUser = useCallback((nextUser) => {
    setUser((current) => (typeof nextUser === 'function' ? nextUser(current) : nextUser));
  }, []);

  const updateProfile = useCallback(async (profile) => {
    const data = await authApi.updateProfile(profile);
    updateUser(data.user);
    return data.user;
  }, [updateUser]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await changePasswordAndEndSession(authApi, logout, currentPassword, newPassword);
  }, [logout]);

  const value = useMemo(() => ({
    user,
    accessToken,
    authState,
    isAuthenticated: authState === 'authenticated',
    isInitializing: authState === 'initializing',
    login,
    logout,
    refreshSession,
    updateUser,
    updateProfile,
    changePassword,
    hasPermission: (permission) => userHasPermission(user, permission),
    hasAnyPermission: (permissions) => userHasAnyPermission(user, permissions),
    hasRole: (role) => userHasRole(user, role),
  }), [
    user, accessToken, authState, login, logout, refreshSession,
    updateUser, updateProfile, changePassword,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
