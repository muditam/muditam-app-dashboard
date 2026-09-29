// Login for the /widget admin section is checked server-side, in
// muditam-app-backend (routes/commerceWidget.js `/auth/login`) — the
// username/password never ship to the browser. This module just wraps the
// resulting JWT in localStorage for the UI to read.
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { getWidgetToken, setWidgetToken, clearWidgetToken } from "../../lib/widgetSession";

export function isAuthenticated() {
  return Boolean(getWidgetToken());
}

export async function login(username, password) {
  const data = await commerceWidgetApi.login(username, password);
  setWidgetToken(data.token);
}

export async function ensureWidgetSession() {
  if (getWidgetToken()) return;
  const response = await fetch("/api/widget-token", { method: "POST" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) {
    throw new Error(data.error || "Widget dashboard token is not available.");
  }
  setWidgetToken(data.token);
}

export function logout() {
  clearWidgetToken();
}
