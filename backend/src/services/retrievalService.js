import { ObjectId } from 'mongodb';
import { chunks } from '../models/Chunk.js';
import { createEmbedding } from './embeddingService.js';
export async function retrieveRelevantChunks({ userId, question, documentIds, documentId, limit = 5 }) {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID for retrieval.');
  const scopedIds = documentIds ?? (documentId ? [documentId] : []);
  if (scopedIds.some((id) => !ObjectId.isValid(id))) throw new Error('Invalid document ID for retrieval.');
  const queryVector = await createEmbedding(question, 'RETRIEVAL_QUERY');
  const filter = { userId: new ObjectId(userId), ...(scopedIds.length ? { documentId: { $in: scopedIds.map((id) => new ObjectId(id)) } } : {}) };
  try {
    const indexedResults = await chunks().aggregate([{ $vectorSearch: { index: 'chunk_vector_index', path: 'embedding', queryVector, numCandidates: Math.min(limit * 20, 200), limit, filter } }, { $project: { text: 1, pageNumber: 1, documentId: 1, score: { $meta: 'vectorSearchScore' } } }]).toArray();
    if (indexedResults.length) return indexedResults;
    console.warn('[retrieval] Atlas vector search returned no chunks; using development fallback.');
  } catch (error) {
    console.warn('[retrieval] Atlas vector search failed; using development fallback:', error.message);
  }
  // An Atlas index can exist but be stale, use a different dimension, or not yet
  // have indexed freshly uploaded chunks. Treat an empty indexed result exactly
  // like an unavailable index so a ready document remains answerable.
  const candidates = await chunks().find(filter, { projection: { text: 1, pageNumber: 1, documentId: 1, embedding: 1 }, limit: 2_000 }).toArray();
  const magnitude = (vector) => Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  const queryMagnitude = magnitude(queryVector);
  return candidates.map((chunk) => {
    const chunkMagnitude = magnitude(chunk.embedding);
    const score = queryMagnitude && chunkMagnitude ? chunk.embedding.reduce((sum, value, index) => sum + value * queryVector[index], 0) / (chunkMagnitude * queryMagnitude) : 0;
    delete chunk.embedding;
    return { ...chunk, score };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}
