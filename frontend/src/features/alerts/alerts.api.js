// helpers to resolve env urls and fetch initial alerts
export function getEnvUrl(name, fallback) {
  // Vite: import.meta.env
  try {
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return import.meta.env[name];
    }
  } catch (e) {
    // ignore
  }

  // CRA: process.env.REACT_APP_...
  try {
    // eslint-disable-next-line no-undef
    const key = 'REACT_APP_' + name.replace(/^VITE_/, '');
    if (process && process.env && process.env[key]) return process.env[key];
  } catch (e) {}

  return fallback || window.location.origin;
}

export function getApiBase() {
  return getEnvUrl('VITE_ALERTS_API_BASE_URL', window.location.origin);
}

export function getSocketUrl() {
  return getEnvUrl('VITE_ALERTS_SOCKET_URL', window.location.origin);
}

export async function fetchInitialAlerts(signal) {
  const url = `${getApiBase()}/api/alerts`;
  try {
    const resp = await fetch(url, { signal, credentials: 'include' });
    if (resp.status === 404) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    // abort or network error
    return [];
  }
}

export function resolveImageUrl(alert) {
  if (!alert || !alert.image_url) return null;
  if (/^https?:\/\//i.test(alert.image_url)) return alert.image_url;
  const base = getApiBase();
  return `${base}${alert.image_url}`;
}
