import { api } from './api';

export const documentService = {
  list: () => api('/documents'),
  upload: (body) => api('/documents', { method: 'POST', body }),
};
