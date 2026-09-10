import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useChat } from '../hooks/useChat';

export default function ChatPage() { const { messages, isStreaming, sendMessage, error, isReady } = useChat(); return <div className="chat-layout"><aside className="chat-history"><button className="new-chat">+ New chat</button><p>CONVERSATION</p><button className="selected">New conversation</button></aside><section className="chat-panel"><header className="chat-header"><div><span className="eyebrow">KNOWLEDGEAI</span><h1>Research Assistant</h1></div><span className="ready-dot">All documents</span></header><div className="chat-scroll">{messages.map((message) => <ChatMessage key={message.id} message={message} />)}{isStreaming && <LoadingSpinner label="Finding the best sources…" />}{error && <p className="form-error" role="alert">{error}</p>}</div><ChatInput onSend={sendMessage} disabled={isStreaming || !isReady} /><p className="chat-disclaimer">KnowledgeAI can make mistakes. Check cited sources for important information.</p></section></div>; }
