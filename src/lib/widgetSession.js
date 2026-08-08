const TOKEN_KEY = "muditam_widget_token";

export function getWidgetToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setWidgetToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearWidgetToken() {
  localStorage.removeItem(TOKEN_KEY);
}
