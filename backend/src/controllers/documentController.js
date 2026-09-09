import { ObjectId } from 'mongodb';
import { documents, documentFilter } from '../models/Document.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { createDocument, processDocument, removeDocument } from '../services/documentService.js';
export async function listDocuments(req, res) { const data = await documents().find({ userId: new ObjectId(req.user._id) }).sort({ createdAt: -1 }).toArray(); res.json({ success: true, data: { documents: data } }); }
export async function uploadDocument(req, res) { if (!req.file) throw new AppError('FILE_REQUIRED', 'Please choose a PDF to upload.', 400); const document = await createDocument({ userId: req.user._id, file: req.file }); processDocument(document); res.status(202).json({ success: true, data: { document } }); }
export async function getDocument(req, res) { const document = await documents().findOne(documentFilter(req.params.id, req.user._id)); if (!document) throw new AppError('DOCUMENT_NOT_FOUND', 'Document could not be found.', 404); res.json({ success: true, data: { document } }); }
export async function deleteDocument(req, res) { const document = await documents().findOne(documentFilter(req.params.id, req.user._id)); if (!document) throw new AppError('DOCUMENT_NOT_FOUND', 'Document could not be found.', 404); await removeDocument(document); res.status(204).send(); }
