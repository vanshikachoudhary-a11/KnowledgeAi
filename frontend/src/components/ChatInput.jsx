import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const submit = (event) => { event.preventDefault(); if (message.trim() && !disabled) { onSend(message.trim()); setMessage(''); } };
  return <form className="chat-input" onSubmit={submit}><textarea aria-label="Ask about your documents" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about your documents..." rows="1" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) submit(event); }} /><button aria-label="Send message" disabled={!message.trim() || disabled}>↑</button></form>;
}
