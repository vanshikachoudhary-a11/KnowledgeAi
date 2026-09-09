import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useChat } from '../hooks/useChat';

const chats = ['Research findings', 'ML model notes', 'Database revision'];
export default function ChatPage() { const { messages, isStreaming, sendMessage } = useChat(); return <div className="chat-layout"><aside className="chat-history"><button className="new-chat">+ New chat</button><p>RECENT CHATS</p>{chats.map((chat, index) => <button key={chat} className={index === 0 ? 'selected' : ''}>{chat}</button>)}</aside><section className="chat-panel"><header className="chat-header"><div><span className="eyebrow">KNOWLEDGEAI</span><h1>Research Assistant</h1></div><span className="ready-dot">All documents</span></header><div className="chat-scroll">{messages.map((message) => <ChatMessage key={message.id} message={message} />)}{isStreaming && <LoadingSpinner label="Finding the best sources…" />}</div><ChatInput onSend={sendMessage} disabled={isStreaming} /><p className="chat-disclaimer">KnowledgeAI can make mistakes. Check cited sources for important information.</p></section></div>; }
