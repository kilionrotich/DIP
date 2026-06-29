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

