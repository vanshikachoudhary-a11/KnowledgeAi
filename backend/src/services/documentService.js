import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectId } from 'mongodb';
import { PDFParse } from 'pdf-parse';
import { documents } from '../models/Document.js';
import { chunks } from '../models/Chunk.js';
import { chunkText } from '../utils/chunkText.js';
import { createEmbeddings } from './embeddingService.js';

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const embeddingBatchSize = 20;

export async function createDocument({ userId, file }) {
  const document = { userId: new ObjectId(userId), filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, storageUrl: `/uploads/${file.filename}`, status: 'uploaded', pageCount: 0, createdAt: new Date(), updatedAt: new Date() };
  const { insertedId } = await documents().insertOne(document);
  return { ...document, _id: insertedId };
}
export async function processDocument(document) {
  try {
    await documents().updateOne({ _id: document._id }, { $set: { status: 'processing', processingError: null, updatedAt: new Date() } });
    await chunks().deleteMany({ documentId: document._id });
    const parser = new PDFParse({ data: await fs.readFile(path.join(uploadsDirectory, document.filename)) });
    const result = await parser.getText();
    await parser.destroy();
    const chunkRecords = [];
    let chunkIndex = 0;
    for (const page of result.pages) {
      const cleanText = page.text.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      const pageChunks = chunkText(cleanText).map((text) => ({ text, pageNumber: page.num, chunkIndex: chunkIndex++ }));
      for (let start = 0; start < pageChunks.length; start += embeddingBatchSize) {
        const batch = pageChunks.slice(start, start + embeddingBatchSize);
        const embeddings = await createEmbeddings(batch.map(({ text }) => text));
        batch.forEach((chunk, index) => chunkRecords.push({ userId: document.userId, documentId: document._id, ...chunk, embedding: embeddings[index], createdAt: new Date() }));
      }
    }
    if (chunkRecords.length) await chunks().insertMany(chunkRecords);
    await documents().updateOne({ _id: document._id }, { $set: { status: 'ready', pageCount: result.total, updatedAt: new Date() } });
  } catch (error) {
    await chunks().deleteMany({ documentId: document._id }).catch(() => undefined);
    await documents().updateOne({ _id: document._id }, { $set: { status: 'failed', processingError: error.message, updatedAt: new Date() } }).catch(() => undefined);
  }
}
export async function removeDocument(document) { await chunks().deleteMany({ documentId: document._id }); await documents().deleteOne({ _id: document._id }); await fs.unlink(path.join(uploadsDirectory, document.filename)).catch(() => undefined); }
