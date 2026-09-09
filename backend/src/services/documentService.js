import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb';
import { PDFParse } from 'pdf-parse';
import { documents } from '../models/Document.js';
import { chunks } from '../models/Chunk.js';
import { chunkText } from '../utils/chunkText.js';
import { createEmbedding } from './embeddingService.js';

export async function createDocument({ userId, file }) {
  const document = { userId: new ObjectId(userId), filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, storageUrl: `/uploads/${file.filename}`, status: 'uploaded', pageCount: 0, createdAt: new Date(), updatedAt: new Date() };
  const { insertedId } = await documents().insertOne(document);
  return { ...document, _id: insertedId };
}
export async function processDocument(document) {
  await documents().updateOne({ _id: document._id }, { $set: { status: 'processing', updatedAt: new Date() } });
  try {
    const parser = new PDFParse({ data: await fs.readFile(`uploads/${document.filename}`) });
    const [result, info] = await Promise.all([parser.getText(), parser.getInfo({ parsePageInfo: true })]);
    await parser.destroy();
    const textChunks = chunkText(result.text);
    const chunkRecords = [];
    for (let index = 0; index < textChunks.length; index += 1) {
      const text = textChunks[index];
      const embedding = await createEmbedding(text);
      chunkRecords.push({ userId: document.userId, documentId: document._id, text, pageNumber: null, chunkIndex: index, embedding, createdAt: new Date() });
    }
    if (chunkRecords.length) await chunks().insertMany(chunkRecords);
    await documents().updateOne({ _id: document._id }, { $set: { status: 'ready', pageCount: info.total || 0, updatedAt: new Date() } });
  } catch (error) { await documents().updateOne({ _id: document._id }, { $set: { status: 'failed', processingError: error.message, updatedAt: new Date() } }); }
}
export async function removeDocument(document) { await chunks().deleteMany({ documentId: document._id }); await documents().deleteOne({ _id: document._id }); await fs.unlink(`uploads/${document.filename}`).catch(() => undefined); }
