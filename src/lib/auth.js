import api from './api';

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('auth_user');
  return raw ? JSON.parse(raw) : null;
}

function persistSession({ token, user }) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: user }));
}

export async function login(email, password) {
  const { data } = await api.post('/login', { email, password });
  persistSession(data);
  return data.user;
}

export async function register(fullName, email, password) {
  const { data } = await api.post('/register', {
    full_name: fullName,
    email,
    password,
  });
  persistSession(data);
  return data.user;
}

export async function logout() {
  try {
    await api.post('/logout');
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }));
  }
}

export async function fetchCurrentUser() {
  if (!getToken()) return null;
  try {
    const { data } = await api.get('/me');
    const user = data.data;
    localStorage.setItem('auth_user', JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}
