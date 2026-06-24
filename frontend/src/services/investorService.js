import api from './api';

export async function getInvestors() {
  const { data } = await api.get('/api/investors');
  return data;
}

