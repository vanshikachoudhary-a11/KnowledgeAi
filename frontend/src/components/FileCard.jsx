import { formatDate } from '../utils/formatDate';

export default function FileCard({ document, onDelete, onRetry }) {
  const status = document.status || 'ready';
  const name = document.name || document.originalName;
  const size = typeof document.size === 'number' ? `${(document.size / 1024 / 1024).toFixed(1)} MB` : document.size;
  const label = status === 'ready' ? 'Ready' : status === 'failed' ? 'Failed' : document.processingStage?.startsWith('OCR') ? 'OCR processing' : 'Processing';
  return <article className="file-card"><div className="file-icon">PDF</div><div className="file-details"><strong>{name}</strong><span>{size} · {formatDate(document.updatedAt)}{status === 'failed' && document.processingError ? ` · ${document.processingError}` : ''}</span></div><span className={`status status--${status}`}>{label}</span>{status === 'failed' && onRetry && <button className="icon-button" onClick={() => onRetry(document._id)} aria-label={`Retry ${name}`}>↻</button>}{onDelete && <button className="icon-button" onClick={() => onDelete(document._id)} aria-label={`Delete ${name}`}>×</button>}</article>;
}
