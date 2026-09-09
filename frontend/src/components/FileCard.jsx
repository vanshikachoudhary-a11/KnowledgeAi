import { formatDate } from '../utils/formatDate';

export default function FileCard({ document }) {
  const status = document.status || 'ready';
  return <article className="file-card"><div className="file-icon">PDF</div><div className="file-details"><strong>{document.name}</strong><span>{document.size} · {formatDate(document.updatedAt)}</span></div><span className={`status status--${status}`}>{status === 'ready' ? 'Ready' : 'Processing'}</span><button className="icon-button" aria-label={`More options for ${document.name}`}>•••</button></article>;
}
