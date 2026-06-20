import api from './api';

export async function getDeals() {
  const { data } = await api.get('/api/deals');
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

export async function verifyPayment(investmentIdOrProofId) {
  // Backend may differ; keep flexible by sending id
  const { data } = await api.post(`/api/payments/verify`, { id: investmentIdOrProofId });
  return data;
}

