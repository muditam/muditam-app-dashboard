const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com';

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
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
    return request(`/api/commerce-widget/conversations?${query.toString()}`);
  },
  getConversation(conversationId) {
    return request(`/api/commerce-widget/conversations/${encodeURIComponent(conversationId)}`);
  },
};
