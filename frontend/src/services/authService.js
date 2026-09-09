import { api } from './api';

export const authService = {
  login: (credentials) => api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (details) => api('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
};
