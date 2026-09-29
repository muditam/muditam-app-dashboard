const API_BASE = (process.env.WIDGET_API_BASE_URL || process.env.VITE_API_BASE_URL || 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com').replace(/\/$/, '');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'method_not_allowed' });
  }

  const username = process.env.WIDGET_ADMIN_USERNAME;
  const password = process.env.WIDGET_ADMIN_PASSWORD;
  if (!username || !password) {
    return response.status(503).json({ error: 'widget_admin_not_configured' });
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/commerce-widget/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const payload = await upstream.json().catch(() => ({}));
    return response.status(upstream.status).json(payload);
  } catch {
    return response.status(502).json({ error: 'widget_token_unavailable' });
  }
}
