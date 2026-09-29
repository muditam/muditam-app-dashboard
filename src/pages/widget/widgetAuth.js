// Login for the /widget admin section is checked server-side, in
// muditam-app-backend (routes/commerceWidget.js `/auth/login`) — the
// username/password never ship to the browser. This module just wraps the
// resulting JWT in localStorage for the UI to read.
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { getWidgetToken, setWidgetToken, clearWidgetToken } from "../../lib/widgetSession";

const WIDGET_ADMIN_USERNAME = import.meta.env.VITE_WIDGET_ADMIN_USERNAME || "";
const WIDGET_ADMIN_PASSWORD = import.meta.env.VITE_WIDGET_ADMIN_PASSWORD || "";

export function isAuthenticated() {
  return Boolean(getWidgetToken());
}

export async function login(username, password) {
  const data = await commerceWidgetApi.login(username, password);
  setWidgetToken(data.token);
}

export async function ensureWidgetSession() {
  if (getWidgetToken()) return;
  if (!WIDGET_ADMIN_USERNAME || !WIDGET_ADMIN_PASSWORD) {
    throw new Error("Widget dashboard token credentials are not configured.");
  }
  await login(WIDGET_ADMIN_USERNAME, WIDGET_ADMIN_PASSWORD);
}

export function logout() {
  clearWidgetToken();
}
