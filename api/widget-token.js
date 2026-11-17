export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'method_not_allowed' });
  }

  // Retire the credential broker. Widget tokens must come from an explicit
  // credential-validated login, never from this public endpoint.
  return response.status(401).json({ error: 'authentication_required' });
}
