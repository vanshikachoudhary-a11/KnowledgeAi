export default function SourceCitation({ source }) {
  return <span className="source-citation">📄 {source.filename} — p. {source.pageNumber ?? source.page ?? '—'}</span>;
}
