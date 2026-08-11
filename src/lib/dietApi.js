const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com');

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: isFormData
      ? { ...(options.headers || {}) }
      : { 
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
    ...options,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Request failed');
  }
  return payload;
}

export const dietApi = {
  getHealthProfileList(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.goal) query.set('goal', params.goal);
    return request(`/api/smart-diet-plan/health-profile-list?${query.toString()}`);
  },
  getHealthProfile(leadId) {
    return request(`/api/smart-diet-plan/health-profile/${leadId}`);
  },
  saveHealthProfile(payload) {
    return request('/api/smart-diet-plan/health-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getPlansByLead(leadId) {
    return request(`/api/smart-diet-plan/by-lead/${leadId}`);
  },
  getPlan(planId) {
    return request(`/api/smart-diet-plan/${planId}`);
  },
  generatePlan(payload) {
    return request('/api/smart-diet-plan/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePlan(planId, payload) {
    return request(`/api/smart-diet-plan/${planId}/editor`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  addFood(planId, payload) {
    return request(`/api/smart-diet-plan/${planId}/add-food`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  removeFood(planId, payload) {
    return request(`/api/smart-diet-plan/${planId}/remove-food`, {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  },
  searchFoods(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
      query.set(key, Array.isArray(value) ? value.join(',') : value);
    });
    return request(`/api/smart-diet-plan/food-search?${query.toString()}`);
  },
  generateToken(payload) {
    return request('/api/smart-diet-plan/generate-token', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
