const PREFIX = 'ps_';

export function load(key, defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function save(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

export function remove(key) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFIX + key);
}
