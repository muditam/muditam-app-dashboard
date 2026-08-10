import { getWidgetToken, clearWidgetToken } from "./widgetSession";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com';

async function request(path, options = {}) {
  const token = getWidgetToken();
  const requestOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  const isReadOnly = !requestOptions.method || requestOptions.method === 'GET';
  let response;
  for (let attempt = 0; attempt < (isReadOnly ? 2 : 1); attempt += 1) {
    try {
      response = await fetch(`${API_BASE}${path}`, requestOptions);
      break;
    } catch (error) {
      if (!isReadOnly || attempt === 1) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
  }
  if (!response) throw new Error('Could not connect to the server');
  if (response.status === 401) {
    clearWidgetToken();
    window.dispatchEvent(new Event("muditam-widget-unauthorized"));
  }
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }
  return payload;
}

export const commerceWidgetApi = {
  login(username, password) {
    return request(`/api/commerce-widget/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  },
  getOverview(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    return request(`/api/commerce-widget/overview?${query.toString()}`);
  },
  getConversations(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.limit) query.set('limit', params.limit);
    if (params.intent) query.set('intent', params.intent);
    if (params.feedback) query.set('feedback', params.feedback);
    if (params.addedToCart) query.set('addedToCart', 'true');
    if (params.healthConcern) query.set('healthConcern', params.healthConcern);
    if (params.productSlug) query.set('productSlug', params.productSlug);
    if (params.longChat) query.set('longChat', 'true');
    if (params.repeatCustomer) query.set('repeatCustomer', 'true');
    if (params.testSession) query.set('testSession', 'true');
    return request(`/api/commerce-widget/conversations?${query.toString()}`);
  },
  getConversation(conversationId) {
    return request(`/api/commerce-widget/conversations/${encodeURIComponent(conversationId)}`);
  },
  getWidgetConfig() {
    return request(`/api/commerce-widget/widget-config`);
  },
  saveWidgetConfig(config) {
    return request(`/api/commerce-widget/widget-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },
  testBot(payload) {
    return request(`/api/commerce-widget/bot-flow/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  getBotProducts() {
    return request(`/api/commerce-widget/bot-flow/products`);
  },
  getBotKnowledge() {
    return request(`/api/commerce-widget/bot-flow/knowledge`);
  },
  addBotKnowledge(payload) {
    return request(`/api/commerce-widget/bot-flow/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  getMissingInfo() {
    return request(`/api/commerce-widget/bot-flow/missing-info`);
  },
  getDiscounts() {
    return request(`/api/commerce-widget/bot-flow/discounts`);
  },
  saveDiscounts(payload) {
    return request(`/api/commerce-widget/bot-flow/discounts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
