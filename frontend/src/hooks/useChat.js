import { useState } from 'react';

const starterMessages = [{
  id: 'welcome',
  role: 'assistant',
  content: 'I’m ready to help you find answers across your knowledge base. Ask me about one of your documents.',
  sources: [],
}];

export function useChat() {
  const [messages, setMessages] = useState(starterMessages);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = (content) => {
    const userMessage = { id: crypto.randomUUID(), role: 'user', content };
    const assistantMessage = {
      id: crypto.randomUUID(), role: 'assistant',
      content: 'This frontend preview will stream grounded answers here once the RAG backend is connected.',
      sources: [{ filename: 'KnowledgeAI demo', page: 1 }],
    };
    setMessages((current) => [...current, userMessage]);
    setIsStreaming(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, assistantMessage]);
      setIsStreaming(false);
    }, 600);
  };

  return { messages, isStreaming, sendMessage };
}
