import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectId } from 'mongodb';
import { PDFParse } from 'pdf-parse';
import { documents } from '../models/Document.js';
import { chunks } from '../models/Chunk.js';
import { chunkText } from '../utils/chunkText.js';
import { createEmbeddings } from './embeddingService.js';
import { extractTextWithOcr } from './ocrService.js';
import { env } from '../config/env.js';

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const embeddingBatchSize = 20;
const log = (document, stage, detail = '') => console.info(`[document:${document._id}] ${stage}${detail ? ` — ${detail}` : ''}`);
const setStage = (document, processingStage) => documents().updateOne({ _id: document._id }, { $set: { processingStage, updatedAt: new Date() } });

export async function createDocument({ userId, file }) {
  const document = { userId: new ObjectId(userId), filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, storageUrl: `/uploads/${file.filename}`, status: 'uploaded', pageCount: 0, createdAt: new Date(), updatedAt: new Date() };
  const { insertedId } = await documents().insertOne(document);
  return { ...document, _id: insertedId };
}
export async function processDocument(document) {
  let stage = 'starting';
  try {
    await documents().updateOne({ _id: document._id }, { $set: { status: 'processing', processingStage: 'starting', processingError: null, updatedAt: new Date() } });
    log(document, 'processing started');
    stage = 'clearing previous chunks';
    await setStage(document, stage);
    await chunks().deleteMany({ documentId: document._id });
    stage = 'extracting PDF text';
    await setStage(document, stage);
    const parser = new PDFParse({ data: await fs.readFile(path.join(uploadsDirectory, document.filename)) });
    const result = await parser.getText();
    await parser.destroy();
    if (!result.pages?.length) throw new Error('The PDF contains no readable pages.');
    if (result.total > env.ocrMaxPages) throw new Error(`PDF has ${result.total} pages, exceeding the configured OCR limit of ${env.ocrMaxPages}.`);
    const chunkRecords = [];
    let chunkIndex = 0;
    stage = 'chunking and embedding';
    await setStage(document, stage);
    for (const page of result.pages) {
      let cleanText = page.text.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (cleanText.length < env.ocrTextThreshold) {
        stage = `OCR on page ${page.num}`;
        await setStage(document, stage);
        log(document, 'OCR started', `page ${page.num}`);
        cleanText = await extractTextWithOcr({ pdfPath: path.join(uploadsDirectory, document.filename), pageNumber: page.num });
        log(document, 'OCR complete', `page ${page.num}, ${cleanText.length} characters`);
      }
      const pageChunks = chunkText(cleanText).map((text) => ({ text, pageNumber: page.num, chunkIndex: chunkIndex++ }));
      for (let start = 0; start < pageChunks.length; start += embeddingBatchSize) {
        const batch = pageChunks.slice(start, start + embeddingBatchSize);
        const embeddings = await createEmbeddings(batch.map(({ text }) => text));
        batch.forEach((chunk, index) => {
          const embedding = embeddings[index];
          if (!Array.isArray(embedding) || !embedding.length || !embedding.every(Number.isFinite)) throw new Error('Embedding service returned an invalid vector.');
          chunkRecords.push({ userId: document.userId, documentId: document._id, ...chunk, embedding, createdAt: new Date() });
        });
      }
    }
    if (!chunkRecords.length) throw new Error('No searchable text chunks could be created from this PDF.');
    const dimensions = new Set(chunkRecords.map((chunk) => chunk.embedding.length));
    if (dimensions.size !== 1) throw new Error('Generated embeddings have inconsistent dimensions.');
    stage = 'saving chunks';
    await setStage(document, stage);
    const inserted = await chunks().insertMany(chunkRecords, { ordered: true });
    if (inserted.insertedCount !== chunkRecords.length) throw new Error('Not all searchable chunks were saved.');
    stage = 'verifying saved chunks';
    await setStage(document, stage);
    const savedCount = await chunks().countDocuments({ documentId: document._id, userId: document.userId });
    if (savedCount !== chunkRecords.length) throw new Error('Saved chunk verification failed.');
    await documents().updateOne({ _id: document._id }, { $set: { status: 'ready', processingStage: 'ready', pageCount: result.total, chunkCount: savedCount, embeddingDimensions: dimensions.values().next().value, processingError: null, updatedAt: new Date() } });
    log(document, 'ready', `${savedCount} chunks`);
  } catch (error) {
    console.error(`[document:${document._id}] failed during ${stage}:`, error);
    try { await chunks().deleteMany({ documentId: document._id }); } catch (cleanupError) { console.error(`[document:${document._id}] chunk cleanup failed:`, cleanupError); }
    try { await documents().updateOne({ _id: document._id }, { $set: { status: 'failed', processingStage: stage, processingError: `Processing failed during ${stage}: ${error.message}`, updatedAt: new Date() } }); } catch (statusError) { console.error(`[document:${document._id}] failure status update failed:`, statusError); }
  }
}
export async function recoverInterruptedDocuments() { const result = await documents().updateMany({ status: 'processing' }, { $set: { status: 'failed', processingStage: 'interrupted', processingError: 'Processing was interrupted before completion. Please retry this document.', updatedAt: new Date() } }); if (result.modifiedCount) console.warn(`[document] marked ${result.modifiedCount} interrupted processing job(s) as failed`); }
export async function removeDocument(document) { await chunks().deleteMany({ documentId: document._id }); await documents().deleteOne({ _id: document._id }); await fs.unlink(path.join(uploadsDirectory, document.filename)).catch(() => undefined); }
