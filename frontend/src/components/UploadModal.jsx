import { useRef, useState } from 'react';
import Button from './Button';

export default function UploadModal({ isOpen, onClose, onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  if (!isOpen) return null;
  const submit = () => { if (file) { onUpload(file); setFile(null); onClose(); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close">×</button><span className="eyebrow">Knowledge base</span><h2 id="upload-title">Upload a document</h2><p>PDF support is ready. Your document will be processed and made searchable when the backend is connected.</p><button className="upload-dropzone" onClick={() => inputRef.current?.click()}><span>↑</span><strong>{file ? file.name : 'Choose a PDF file'}</strong><small>PDF up to 10 MB</small></button><input ref={inputRef} hidden type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!file} onClick={submit}>Upload document</Button></div></section></div>;
}
