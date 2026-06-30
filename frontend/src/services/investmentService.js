import api from './api';

export async function getInvestments() {
  const { data } = await api.get('/api/investments');
  return data;
}

export async function getInvestmentsByDeal(dealId) {
  const { data } = await api.get(`/api/deals/${dealId}/investments`);
  return data;
}

// NOTE: keep commitInvestment unchanged; endpoint must be implemented server-side.


export async function commitInvestment(dealId, payload) {
  const { data } = await api.post(`/api/deals/${dealId}/invest`, payload);
  return data;
}

export async function getProfits() {
  const { data } = await api.get('/api/profits');
  return data;
}

// Admin: verify an investment's proof and mark it active.
export async function verifyInvestment(investmentId) {
  const { data } = await api.post(`/api/investments/${investmentId}/verify`, {});
  return data;
}

// Admin: reject an investment's proof (keeps it pending).
export async function rejectInvestment(investmentId, reason) {
  const { data } = await api.post(`/api/investments/${investmentId}/reject`, { reason });
  return data;
}

// Role-aware dashboard summary (Total Invested, Profits, ROI, counts).
export async function getInvestmentSummary() {
  const { data } = await api.get('/api/investments/summary');
  return data;
}

