import { api } from './api';

export const chatService = {
  list: () => api('/chats'),
  sendMessage: (chatId, message) => api(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
};
