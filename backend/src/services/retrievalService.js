import { ObjectId } from 'mongodb';
import { chunks } from '../models/Chunk.js';
import { createEmbedding } from './embeddingService.js';
export async function retrieveRelevantChunks({ userId, question, limit = 5 }) {
  const queryVector = await createEmbedding(question);
  return chunks().aggregate([{ $vectorSearch: { index: 'chunk_vector_index', path: 'embedding', queryVector, numCandidates: limit * 20, limit, filter: { userId: new ObjectId(userId) } } }, { $project: { text: 1, pageNumber: 1, documentId: 1, score: { $meta: 'vectorSearchScore' } } }]).toArray();
}
