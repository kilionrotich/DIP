import api from './api';

export async function sendMessage(payload) {
  const { subject, body } = payload || {};
  // Backend resolves recipient/admin automatically.
  const { data } = await api.post('/api/messages/send', { subject, body });
  return data;
}


export async function getInboxMessages() {
  // Backend messages route is defined as GET /api/messages (mounting /api/messages with router '/').
  // It returns: { messages: [...] }
  const { data } = await api.get('/api/messages');
  return data?.messages || [];
}


export async function getPrimaryAdmin() {
  const { data } = await api.get('/api/admins/primary');
  return data;
}
