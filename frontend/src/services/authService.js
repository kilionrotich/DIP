import api from './api';

export async function register(payload) {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/api/auth/login', payload);
  // expected: { token, user } OR { token }
  return data;
}

