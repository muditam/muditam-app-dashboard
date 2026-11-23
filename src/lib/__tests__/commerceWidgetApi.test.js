import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../auth', () => ({ getDashboardToken: async () => 'test-token', invalidateDashboardToken: vi.fn() }));
import { commerceWidgetApi } from '../commerceWidgetApi';
afterEach(() => vi.unstubAllGlobals());
it('serializes server-side conversation search, lead page/filter and missing-info cursor', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } }));
  // Each request gets a fresh Response since bodies can only be consumed once.
  fetcher.mockImplementation(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetcher);
  await commerceWidgetApi.getConversations({ search: 'session-on-page-two', page: 1 });
  await commerceWidgetApi.getLeads({ page: 5, limit: 50, search: 'Customer 201', status: 'closed' });
  await commerceWidgetApi.getMissingInfo({ cursor: 'next/page+token', limit: 50 });
  const urls = fetcher.mock.calls.map(([url]) => new URL(url, 'http://localhost'));
  expect(urls[0].searchParams.get('search')).toBe('session-on-page-two');
  expect(Object.fromEntries(urls[1].searchParams)).toMatchObject({ page: '5', limit: '50', search: 'Customer 201', status: 'closed' });
  expect(urls[2].searchParams.get('cursor')).toBe('next/page+token');
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
});
