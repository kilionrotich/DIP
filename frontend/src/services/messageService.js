import api from './api';

export async function sendMessage(payload) {
  const { receiver_id, subject, body } = payload || {};
  const { data } = await api.post('/api/messages', { receiver_id, subject, body });
  return data;
}

export async function getInboxMessages({ sender_id } = {}) {
  const params = {};
  if (sender_id) params.sender_id = sender_id;
  const { data } = await api.get('/api/messages', { params });
  return data?.messages || [];
}

