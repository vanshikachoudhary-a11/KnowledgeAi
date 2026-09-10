import { useRef, useState } from 'react';
import Button from './Button';

export default function UploadModal({ isOpen, onClose, onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  if (!isOpen) return null;
  const submit = async () => { if (!file) return; setError(''); setIsUploading(true); try { await onUpload(file); setFile(null); onClose(); } catch (uploadError) { setError(uploadError.message); } finally { setIsUploading(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close">×</button><span className="eyebrow">Knowledge base</span><h2 id="upload-title">Upload a document</h2><p>Upload a PDF and we’ll process it for your knowledge base.</p><button className="upload-dropzone" onClick={() => inputRef.current?.click()}><span>↑</span><strong>{file ? file.name : 'Choose a PDF file'}</strong><small>PDF up to 10 MB</small></button><input ref={inputRef} hidden type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button><Button disabled={!file || isUploading} onClick={submit}>{isUploading ? 'Uploading…' : 'Upload document'}</Button></div></section></div>;
}
