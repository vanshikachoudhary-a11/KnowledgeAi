import { env } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';

export async function createEmbedding(input, taskType = 'RETRIEVAL_DOCUMENT') {
  const [embedding] = await createEmbeddings([input], taskType);
  return embedding;
}

// Batch embeddings substantially reduces upload time and API overhead for PDFs.
export async function createEmbeddings(inputs, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!env.geminiKey) throw new AppError('AI_NOT_CONFIGURED', 'Gemini API key is not configured.', 503);
  if (!inputs.length) return [];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.embeddingModel}:batchEmbedContents?key=${env.geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({ requests: inputs.map((text) => ({ model: `models/${env.embeddingModel}`, content: { parts: [{ text }] }, taskType, outputDimensionality: 768 })) }),
  });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new AppError('EMBEDDING_FAILED', error.error?.message || 'Could not create a Gemini embedding.', 502); }
  const data = await response.json();
  const embeddings = data.embeddings?.map((item) => item.values);
  if (!embeddings?.length || embeddings.length !== inputs.length) throw new AppError('EMBEDDING_FAILED', 'The embedding service returned an incomplete response.', 502);
  return embeddings;
}
