import { api } from './api';

export const chatService = {
  list: () => api('/chats'),
  create: (title) => api('/chats', { method: 'POST', body: JSON.stringify({ title }) }),
  messages: (chatId) => api(`/chats/${chatId}`),
  sendMessage: (chatId, message) => api(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  streamMessage: async (chatId, message, onToken, signal) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/chats/${chatId}/messages/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('knowledge-ai-token')}` }, body: JSON.stringify({ message }), signal });
    if (!response.ok || !response.body) throw new Error((await response.json().catch(() => null))?.error?.message || 'The chat request could not be completed.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let result;
    while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || ''; for (const event of events) { const data = event.split('\n').find((line) => line.startsWith('data: '))?.slice(6); if (!data) continue; const payload = JSON.parse(data); if (payload.token) onToken(payload.token); if (event.startsWith('event: error')) throw new Error(payload.message || 'The response was interrupted.'); if (event.startsWith('event: done')) result = payload.message; } }
    return result;
  },
};
