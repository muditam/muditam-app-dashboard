import { getDashboardToken, invalidateDashboardToken } from "../auth";

const API_BASE = import.meta.env.DEV
  ? '/widget-api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com').replace(/\/$/, '');

async function request(path, options = {}) {
  const token = await getDashboardToken();
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
    // Refresh once. A missing/revoked platform session is handled by AuthGate.
    invalidateDashboardToken(token);
    const freshToken = await getDashboardToken();
    response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      headers: { ...requestOptions.headers, Authorization: `Bearer ${freshToken}` },
    });
    if (response.status === 401) {
      invalidateDashboardToken(freshToken);
      throw new Error('Chat authentication was rejected. Please try again or contact your administrator.');
    }
  }
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const details = Array.isArray(payload?.details)
      ? payload.details
        .map((issue) => {
          const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
          return `${path || 'payload'}: ${issue.message}`;
        })
        .join('; ')
      : '';
    throw new Error([payload?.error || 'Request failed', details].filter(Boolean).join(' '));
  }
  return payload;
}

export const commerceWidgetApi = {
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
    if (params.page) query.set('page', params.page);
    if (params.intent) query.set('intent', params.intent);
    if (params.feedback) query.set('feedback', params.feedback);
    if (params.addedToCart) query.set('addedToCart', 'true');
    if (params.healthConcern) query.set('healthConcern', params.healthConcern);
    const productName = params.productName || params.productSlug;
    if (productName) query.set('productSlug', productName);
    if (params.longChat) query.set('longChat', 'true');
    if (params.repeatCustomer) query.set('repeatCustomer', 'true');
    if (params.testSession) query.set('testSession', 'true');
    if (params.search) query.set('search', params.search);
    return request(`/api/commerce-widget/conversations?${query.toString()}`);
  },
  getConversation(conversationId) {
    return request(`/api/commerce-widget/conversations/${encodeURIComponent(conversationId)}`);
  },
  getLeads(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.limit) query.set('limit', params.limit);
    if (params.page) query.set('page', params.page);
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    return request(`/api/commerce-widget/leads?${query.toString()}`);
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
  saveBotProduct(slug, payload) {
    return request(`/api/commerce-widget/bot-flow/products/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  bulkSaveBotProducts(payload) {
    return request(`/api/commerce-widget/bot-flow/products/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  importBotKnowledge(payload) {
    return request('/api/commerce-widget/bot-flow/knowledge/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  },
  syncDiscounts() {
    return request('/api/commerce-widget/bot-flow/discounts/sync', { method: 'POST' });
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
  updateBotKnowledge(key, payload) {
    return request(`/api/commerce-widget/bot-flow/knowledge/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  deleteBotKnowledge(key) {
    return request(`/api/commerce-widget/bot-flow/knowledge/${encodeURIComponent(key)}`, { method: 'DELETE' });
  },
  getMissingInfo(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.cursor) query.set('cursor', params.cursor);
    const queryString = query.toString();
    return request(`/api/commerce-widget/bot-flow/missing-info${queryString ? `?${queryString}` : ''}`);
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
