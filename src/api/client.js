const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 15_000;

function configuredApiBaseUrl() {
  return (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

function configuredTimeoutMs() {
  const value = Number(import.meta.env?.VITE_API_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

export class ApiClientError extends Error {
  constructor({ status = 0, code = 'REQUEST_FAILED', message = 'Request failed', details = null, cause = null }) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizedError(error) {
  if (error instanceof ApiClientError) return error;
  return new ApiClientError({
    code: 'NETWORK_ERROR',
    message: 'Unable to reach the server. Check your connection and try again.',
    cause: error,
  });
}

export function createApiClient({
  baseUrl = configuredApiBaseUrl(),
  timeoutMs = configuredTimeoutMs(),
  fetchImpl = globalThis.fetch,
} = {}) {
  let accessToken = null;
  let refreshPromise = null;
  let sessionEpoch = 0;
  let sessionHandlers = {};

  const setAccessToken = (token) => {
    accessToken = token || null;
  };

  const clearSession = () => {
    sessionEpoch += 1;
    accessToken = null;
  };

  const setSessionHandlers = (handlers = {}) => {
    sessionHandlers = handlers;
    return () => {
      if (sessionHandlers === handlers) sessionHandlers = {};
    };
  };

  async function rawRequest(path, options = {}) {
    const {
      method = 'GET', body, headers = {}, signal,
      timeout = timeoutMs, includeAuth = true,
    } = options;
    const controller = new AbortController();
    let externallyAborted = false;
    const abortFromSignal = () => {
      externallyAborted = true;
      controller.abort(signal?.reason);
    };
    if (signal?.aborted) abortFromSignal();
    else signal?.addEventListener('abort', abortFromSignal, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const requestHeaders = { Accept: 'application/json', ...headers };
    if (includeAuth && accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isFormData && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers: requestHeaders,
        body: body === undefined || isFormData ? body : JSON.stringify(body),
        signal: controller.signal,
      });
      const contentType = response.headers?.get?.('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;
      if (!response.ok || payload?.success === false) {
        throw new ApiClientError({
          status: response.status,
          code: payload?.error?.code || `HTTP_${response.status}`,
          message: payload?.error?.message || response.statusText || 'Request failed',
          details: payload?.error?.details ?? null,
        });
      }
      if (!payload || payload.success !== true) {
        throw new ApiClientError({
          status: response.status,
          code: 'INVALID_RESPONSE',
          message: 'The server returned an unexpected response.',
        });
      }
      return payload.data;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if (controller.signal.aborted) {
        throw new ApiClientError({
          code: externallyAborted ? 'REQUEST_ABORTED' : 'REQUEST_TIMEOUT',
          message: externallyAborted ? 'Request cancelled.' : 'The server took too long to respond.',
          cause: error,
        });
      }
      throw normalizedError(error);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromSignal);
    }
  }

  async function refreshSession() {
    if (refreshPromise) return refreshPromise;
    const startedAtEpoch = sessionEpoch;
    refreshPromise = rawRequest('/api/admin/auth/refresh', {
      method: 'POST', body: {}, includeAuth: false,
    })
      .then((data) => {
        if (startedAtEpoch !== sessionEpoch) {
          throw new ApiClientError({ status: 401, code: 'SESSION_CHANGED', message: 'Session changed.' });
        }
        setAccessToken(data.accessToken);
        sessionHandlers.onSessionRefreshed?.(data);
        return data;
      })
      .catch((error) => {
        if (startedAtEpoch === sessionEpoch) {
          clearSession();
          sessionHandlers.onSessionExpired?.(normalizedError(error));
        }
        throw normalizedError(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  }

  async function request(path, options = {}) {
    const { retryAuth = true, ...requestOptions } = options;
    try {
      return await rawRequest(path, requestOptions);
    } catch (error) {
      const normalized = normalizedError(error);
      if (normalized.status !== 401 || !retryAuth || path === '/api/admin/auth/refresh') throw normalized;
      await refreshSession();
      return rawRequest(path, requestOptions);
    }
  }

  return {
    request,
    refreshSession,
    setAccessToken,
    getAccessToken: () => accessToken,
    clearSession,
    setSessionHandlers,
  };
}

export const apiClient = createApiClient();
