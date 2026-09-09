import { env } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';

export async function createEmbedding(input) {
  if (!env.openAiKey) throw new AppError('AI_NOT_CONFIGURED', 'Embedding service is not configured.', 503);
  const response = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { Authorization: `Bearer ${env.openAiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.embeddingModel, input }) });
  if (!response.ok) throw new AppError('EMBEDDING_FAILED', 'Could not create an embedding.', 502);
  const data = await response.json();
  return data.data[0].embedding;
}
