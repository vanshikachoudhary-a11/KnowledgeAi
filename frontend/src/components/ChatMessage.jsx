import SourceCitation from './SourceCitation';

export default function ChatMessage({ message }) {
  return <article className={`chat-message chat-message--${message.role}`}><div className="message-avatar">{message.role === 'assistant' ? '✦' : 'You'}</div><div><p>{message.content}</p>{message.sources?.length > 0 && <div className="message-sources"><span>Sources</span>{message.sources.map((source) => <SourceCitation key={`${source.filename}-${source.page}`} source={source} />)}</div>}</div></article>;
}
