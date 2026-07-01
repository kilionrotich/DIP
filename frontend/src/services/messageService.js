import api from './api';

export async function sendMessage(payload) {
  const { subject, body } = payload || {};
  // Backend resolves recipient/admin automatically.
  const { data } = await api.post('/api/messages/send', { subject, body });
  return data;
}


export async function getInboxMessages({ sender_id } = {}) {
  const params = {};
  if (sender_id) params.sender_id = sender_id;
  const { data } = await api.get('/api/messages', { params });
  return data?.messages || [];
}

export async function getPrimaryAdmin() {
  const { data } = await api.get('/api/admins/primary');
  return data;
}
