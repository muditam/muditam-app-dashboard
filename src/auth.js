const DEFAULT_SHIPTRACK_API_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname) ? '/shiptrack-api' : 'https://shiptrack-api.60brands.com';
const SHIPTRACK_API_URL = (import.meta.env.VITE_SHIPTRACK_API_URL || DEFAULT_SHIPTRACK_API_URL).replace(/\/$/, '');
const DEFAULT_LOGIN_URL = window.location.hostname.endsWith('60brands.com') ? 'https://login.60brands.com/login' : 'http://localhost:3000/login';
const LOGIN_URL = (import.meta.env.VITE_LOGIN_URL || DEFAULT_LOGIN_URL).replace(/\/$/, '');
const REQUIRED_APPLICATION = 'chat-dashboard';

function loginUrl() {
  return `${LOGIN_URL}?returnTo=${encodeURIComponent(window.location.href)}`;
}

export async function getSession() {
  const response = await fetch(`${SHIPTRACK_API_URL}/api/auth/session`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return body.user || null;
}

export function hasDashboardAccess(user) {
  if (!user) return false;
  if (user.accountRole === 'superadmin') return true;
  return Array.isArray(user.applications) && user.applications.includes(REQUIRED_APPLICATION);
}

export function redirectToLogin() {
  window.location.replace(loginUrl());
}

export function redirectToPlainLogin() {
  window.location.replace(LOGIN_URL);
}

export async function logout() {
  await fetch(`${SHIPTRACK_API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  redirectToPlainLogin();
}
