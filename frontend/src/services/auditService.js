import api from './api';

export async function getRecentAuditLogs({ limit = 20 } = {}) {
  const { data } = await api.get(`/api/audit-logs/recent?limit=${limit}`);
  return data;
}

