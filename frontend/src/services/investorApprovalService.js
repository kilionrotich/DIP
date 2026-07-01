import api from './api';

// Fetch approval state for the logged-in investor.
// NOTE: Endpoint must exist on backend for this to work.
export async function getMyApprovalStatus() {
  const { data } = await api.get('/api/investors/me/approval');
  return data;
}

// Admin: list investors waiting for approval for the current admin.
// NOTE: Endpoint must exist on backend for this to work.
export async function getPendingInvestorsForAdmin() {
  const { data } = await api.get('/api/investors/pending');
  return data;
}

