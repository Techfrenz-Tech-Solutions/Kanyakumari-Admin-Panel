import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const INTERVALS = [30, 60, 120, 300]; // seconds
const DEFAULT_INTERVAL = 60;

const RefreshContext = createContext(null);

export function RefreshProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const [interval, setIntervalSecs] = useState(DEFAULT_INTERVAL);
  const [countdown, setCountdown] = useState(DEFAULT_INTERVAL);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const listenersRef = useRef(new Set());
  const countdownRef = useRef(interval);

  // Keep ref in sync with state
  useEffect(() => { countdownRef.current = interval; }, [interval]);

  // Broadcast a refresh event to all registered listeners
  const triggerRefresh = useCallback(() => {
    setLastRefreshed(new Date());
    listenersRef.current.forEach((fn) => { try { fn(); } catch (_) {} });
  }, []);

  // Subscribe to refresh events — returns an unsubscribe fn
  const onRefresh = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!enabled) {
      setCountdown(interval);
      return;
    }
    setCountdown(interval);
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return countdownRef.current;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [enabled, interval, triggerRefresh]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  const changeInterval = useCallback((secs) => {
    setIntervalSecs(secs);
    setCountdown(secs);
  }, []);

  const refreshNow = useCallback(() => {
    triggerRefresh();
    setCountdown(countdownRef.current);
  }, [triggerRefresh]);

  return (
    <RefreshContext.Provider value={{
      enabled, toggle,
      interval, intervals: INTERVALS, changeInterval,
      countdown, lastRefreshed,
      onRefresh, refreshNow,
    }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefresh must be used inside RefreshProvider');
  return ctx;
}

/**
 * Convenience hook for pages: call the provided `fetchFn` on mount
 * and whenever an auto-refresh is triggered.
 *
 * Usage:
 *   useAutoRefresh(loadData);
 */
export function useAutoRefresh(fetchFn) {
  const { onRefresh } = useRefresh();
  useEffect(() => {
    const unsub = onRefresh(fetchFn);
    return unsub;
  }, [onRefresh, fetchFn]);
}
