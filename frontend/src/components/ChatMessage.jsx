import ReactMarkdown from 'react-markdown';
import SourceCitation from './SourceCitation';

export default function ChatMessage({ message }) {
  const sources = [...new Map((message.sources || []).map((source) => [source.documentId?.toString() || source.filename, source])).values()];
  return <article className={`chat-message chat-message--${message.role}`}><div className="message-avatar">{message.role === 'assistant' ? '✦' : 'You'}</div><div className="message-content">{message.role === 'assistant' ? <ReactMarkdown>{message.content || '…'}</ReactMarkdown> : <p>{message.content}</p>}{sources.length > 0 && <div className="message-sources"><span>Sources</span>{sources.map((source) => <SourceCitation key={source.documentId?.toString() || source.filename} source={source} />)}</div>}</div></article>;
}
