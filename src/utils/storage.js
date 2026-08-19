// Thin wrapper around localStorage so every slice of data
// persists across reloads and is easy to swap for a real API later.

const NS = 'dw_admin_';
const DATA_VERSION = '2'; // bump this to wipe old cached dummy data

// Clear stale data from previous versions (removes old dummy data from browser)
if (localStorage.getItem('dw_data_version') !== DATA_VERSION) {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(NS))
    .forEach((k) => localStorage.removeItem(k));
  localStorage.setItem('dw_data_version', DATA_VERSION);
}

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) {
      localStorage.setItem(NS + key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently in demo mode
  }
}

export function resetAllData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(NS))
    .forEach((k) => localStorage.removeItem(k));
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
