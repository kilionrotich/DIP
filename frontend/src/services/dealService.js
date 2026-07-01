import api from './api';

function toQuery(filters = {}) {
  const q = {};
  if (filters.status) q.status = filters.status;
  if (filters.sector) q.sector = filters.sector;
  if (filters.roi_min !== undefined && filters.roi_min !== '') q.roi_min = filters.roi_min;
  if (filters.roi_max !== undefined && filters.roi_max !== '') q.roi_max = filters.roi_max;
  if (filters.deadline) q.deadline = filters.deadline;
  if (filters.risk) q.risk = filters.risk;
  return q;
}

// Investor/Admin: fetch deals
export async function getDeals(filters = {}) {
  const { data } = await api.get('/api/deals', { params: toQuery(filters) });
  return data;
}

export async function getDealById(id) {
  const { data } = await api.get(`/api/deals/${id}`);
  return data;
}

// Admin: create/manage deals
export async function createDeal(payload) {
  const { data } = await api.post('/api/deals', payload);
  return data;
}

// Admin: fetch Available Opportunities (open deals without active investments)
export async function getAvailableDeals() {
  const { data } = await api.get('/api/deals/available');
  return data;
}

// Admin/Investor: fetch Active Deals (deals WITH active investments)
export async function getInProgressDeals() {
  const { data } = await api.get('/api/deals/active');
  return data;
}

// Admin: fetch closed/cancelled deals (history)
export async function getHistoryDeals() {
  const { data } = await api.get('/api/deals?status=completed,cancelled');
  return data;
}

export async function updateDeal(dealId, payload) {
  const { data } = await api.put(`/api/deals/${dealId}`, payload);
  return data;
}

export async function cancelDeal(dealId, { hardDelete = false } = {}) {
  const { data } = await api.post(`/api/deals/${dealId}/cancel`, { hardDelete });
  return data;
}

// ✅ New lifecycle endpoints

// Admin: approve a deal
export async function approveDeal(dealId) {
  const { data } = await api.post(`/api/deals/${dealId}/approve`);
  return data;
}

// Admin: close a deal
export async function closeDeal(dealId) {
  const { data } = await api.put(`/api/deals/${dealId}/close`);
  return data;
}

// Admin: get stats (total invested, profit, investments count, deals count)
export async function getStats() {
  const { data } = await api.get('/api/deals/stats');
  return data;
}

// Payment verification (legacy)
export async function verifyPayment(investmentIdOrProofId) {
  const { data } = await api.post(`/api/payments/verify`, { id: investmentIdOrProofId });
  return data;
}