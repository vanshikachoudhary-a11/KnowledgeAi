import { api } from './api';

export const documentService = {
  list: () => api('/documents'),
  upload: (file) => {
    const body = new FormData();
    body.append('file', file);
    return api('/documents', { method: 'POST', body });
  },
  remove: (id) => api(`/documents/${id}`, { method: 'DELETE' }),
  retry: (id) => api(`/documents/${id}/retry`, { method: 'POST' }),
};
