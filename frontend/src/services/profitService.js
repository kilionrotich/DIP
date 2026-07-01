import api from './api';

// Investor: fetch profit summary
export async function getProfits() {
  const { data } = await api.get('/api/profits');
  return data;
}

// Admin: update profit for a specific investment
export async function updateProfit(investmentId, profit) {
  const { data } = await api.put('/api/profits/update', { investment_id: investmentId, profit });
  return data;
}