// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('../../../lib/commerceWidgetApi', () => ({ commerceWidgetApi: { getOverview: vi.fn(), getLeads: vi.fn(), getConversations: vi.fn(), getConversation: vi.fn() } }));
vi.mock('../DateRangeFilter', () => ({ DateRangeFilter: ({ onChange }) => <button onClick={() => onChange({ from: new Date(), to: new Date() })}>Apply dates</button> }));
import { commerceWidgetApi as api } from '../../../lib/commerceWidgetApi';
import WidgetDashboard from '../WidgetDashboard';
import WidgetLeads from '../WidgetLeads';
import WidgetConversations from '../WidgetConversations';
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());
it('clears a failed overview error when retry starts and after success', async () => {
  const retry = deferred();
  api.getOverview.mockRejectedValueOnce(new Error('Old failure')).mockReturnValueOnce(retry.promise);
  render(<WidgetDashboard />);
  await screen.findByText(/Old failure/);
  fireEvent.click(screen.getByText('Retry'));
  expect(screen.queryByText(/Old failure/)).toBeNull();
  await act(async () => retry.resolve({ totalConversations: 4321 }));
  expect(screen.queryByText(/Old failure/)).toBeNull();
  expect(screen.getByText('4,321')).toBeTruthy();
});
it('ignores an earlier overview response after new dates finish loading', async () => {
  const old = deferred();
  api.getOverview.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ totalConversations: 4321 });
  render(<WidgetDashboard />); fireEvent.click(screen.getByText('Apply dates'));
  await screen.findByText('4,321');
  await act(async () => old.reject(new Error('Delayed old failure')));
  expect(screen.queryByText(/Delayed old failure/)).toBeNull();
  expect(screen.getByText('4,321')).toBeTruthy();
});
it('keeps newer lead rows when an earlier filter response arrives late', async () => {
  const old = deferred();
  api.getLeads.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ leads: [{ leadId: 'new', name: 'Newest customer', phone: '123' }], total: 1 });
  render(<WidgetLeads />); fireEvent.click(screen.getByText('Apply dates'));
  await screen.findByText('Newest customer');
  await act(async () => old.resolve({ leads: [{ leadId: 'old', name: 'Old customer', phone: '456' }], total: 1 }));
  expect(screen.queryByText('Old customer')).toBeNull();
  expect(screen.getByText('Newest customer')).toBeTruthy();
});
it('can reach lead 201 and sends search to the server', async () => {
  api.getLeads.mockImplementation(async ({ page, search }) => ({ total: search ? 1 : 201, leads: [{ leadId: String(page), name: search || `Customer ${((page - 1) * 50) + 1}`, phone: '123' }] }));
  render(<WidgetLeads />); await screen.findByText('Customer 1');
  fireEvent.click(screen.getByLabelText('Go to page 5')); await screen.findByText('Customer 201');
  fireEvent.change(screen.getByLabelText('Search name, phone, query or session'), { target: { value: 'Exact customer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText('Exact customer');
  expect(api.getLeads).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'Exact customer', limit: 50 }));
});
it('clears old transcript when selecting a conversation whose request fails', async () => {
  api.getConversations.mockResolvedValue({ conversations: [{ conversationId: 'aaaa1111-session' }, { conversationId: 'bbbb2222-session' }], total: 2 });
  api.getConversation.mockResolvedValueOnce({ conversation: { conversationId: 'aaaa1111-session' }, messages: [{ role: 'user', text: 'Old private transcript' }] }).mockRejectedValueOnce(new Error('B unavailable'));
  render(<WidgetConversations />);
  await waitFor(() => expect(api.getConversations).toHaveBeenCalled());
  const first = await screen.findByText(/aaaa1111/); fireEvent.click(first);
  await screen.findByText('Old private transcript');
  fireEvent.click(screen.getByText(/bbbb2222/));
  await screen.findByText(/B unavailable/);
  expect(screen.queryByText('Old private transcript')).toBeNull();
});
