import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from './errorMiddleware.js';
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const storage = multer.diskStorage({ destination: uploadsDirectory, filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`) });
const fileFilter = (req, file, cb) => file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf' ? cb(null, true) : cb(new AppError('INVALID_FILE_TYPE', 'Only PDF documents are supported.', 400));
export const uploadPdf = multer({ storage, fileFilter, limits: { fileSize: env.maxFileSize, files: 1 } }).single('file');
