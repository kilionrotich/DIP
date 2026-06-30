import api from './api';

// Investor/Admin: fetch all investments
export async function getInvestments() {
  const { data } = await api.get('/api/investments');
  return data;
}

// Investor/Admin: fetch investments tied to a specific deal
export async function getInvestmentsByDeal(dealId) {
  const { data } = await api.get(`/api/deals/${dealId}/investments`);
  return data;
}

// Investor: commit to a deal (creates investment + proof)
export async function commitInvestment(dealId, payload) {
  const { data } = await api.post(`/api/deals/${dealId}/invest`, payload);
  return data;
}

// Admin: verify an investment (status → active)
export async function verifyInvestment(investmentId) {
  const { data } = await api.put(`/api/investments/${investmentId}/verify`);
  return data;
}

// Admin: update profit for an investment
export async function updateProfit(investmentId, profit) {
  const { data } = await api.put(`/api/investments/${investmentId}/profit`, { profit });
  return data;
}

// Investor: fetch profit summary
export async function getProfits() {
  const { data } = await api.get('/api/profits');
  return data;
}