import { env } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';
export async function answerQuestion({ question, context }) {
  if (!env.openAiKey) throw new AppError('AI_NOT_CONFIGURED', 'The chat service is not configured.', 503);
  const prompt = `Answer only using the supplied document context. If it is insufficient, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${env.openAiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.chatModel, messages: [{ role: 'system', content: 'You are a grounded personal knowledge assistant.' }, { role: 'user', content: prompt }], temperature: 0.2 }) });
  if (!response.ok) throw new AppError('LLM_FAILED', 'The AI service could not generate an answer.', 502);
  const data = await response.json(); return data.choices[0]?.message?.content || '';
}
