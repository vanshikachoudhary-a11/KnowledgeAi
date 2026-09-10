import { useEffect, useRef, useState } from 'react';
import { chatService } from '../services/chatService';

const starterMessages = [{
  id: 'welcome',
  role: 'assistant',
  content: 'I’m ready to help you find answers across your knowledge base. Ask me about one of your documents.',
  sources: [],
}];

export function useChat() {
  const [messages, setMessages] = useState(starterMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    const createChat = async () => {
      try {
        const { data } = await chatService.create('New conversation');
        setChatId(data.chat._id);
      } catch (requestError) {
        setError(requestError.message);
      }
    };
    createChat();
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = async (content) => {
    if (!chatId) return;
    const userMessage = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((current) => [...current, userMessage]);
    setIsStreaming(true);
    setError('');
    const streamedMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', sources: [] };
    setMessages((current) => [...current, streamedMessage]);
    try {
      abortRef.current = new AbortController();
      const savedMessage = await chatService.streamMessage(chatId, content, (token) => setMessages((current) => current.map((item) => item.id === streamedMessage.id ? { ...item, content: item.content + token } : item)), abortRef.current.signal);
      if (savedMessage) setMessages((current) => current.map((item) => item.id === streamedMessage.id ? { ...savedMessage, id: savedMessage._id } : item));
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setMessages((current) => current.filter((item) => item.id !== streamedMessage.id || item.content));
        setError(requestError.message);
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  return { messages, isStreaming, sendMessage, error, isReady: Boolean(chatId) };
}
