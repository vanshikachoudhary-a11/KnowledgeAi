import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { chats, chatFilter } from '../models/Chat.js';
import { messages } from '../models/Message.js';
import { documents } from '../models/Document.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { retrieveRelevantChunks } from '../services/retrievalService.js';
import { answerQuestion, streamAnswer } from '../services/llmService.js';

const titleSchema = z.object({ title: z.string().trim().min(1).max(120) });
const chatSchema = z.object({ title: z.string().trim().min(1).max(120).optional(), documentIds: z.array(z.string()).max(20).optional(), documentId: z.string().nullable().optional() });
const messageSchema = z.object({ message: z.string().trim().min(1).max(8000) });
const userObjectId = (userId) => new ObjectId(userId);
const titleFrom = (message) => `${message.slice(0, 57).trim()}${message.length > 57 ? '…' : ''}`;

async function getScopedDocuments(chat, userId) {
  const ids = chat.documentIds ?? (chat.documentId ? [chat.documentId] : []);
  if (!ids.length) return [];
  const documentsInScope = await documents().find({ _id: { $in: ids }, userId: userObjectId(userId) }).toArray();
  if (documentsInScope.length !== ids.length) throw new AppError('DOCUMENT_NOT_FOUND', 'One or more selected documents are no longer available.', 404);
  const unavailable = documentsInScope.find((document) => document.status !== 'ready');
  if (unavailable) throw new AppError('DOCUMENT_NOT_READY', unavailable.status === 'failed' ? `This document could not be processed: ${unavailable.originalName}.` : 'Your document is still being processed. Please wait.', 409);
  return documentsInScope;
}
async function prepareAnswer(chat, userId, question) {
  const selectedDocuments = await getScopedDocuments(chat, userId);
  const relevant = await retrieveRelevantChunks({ userId, question, documentIds: selectedDocuments.map((document) => document._id.toString()), limit: 6 });
  if (!relevant.length) throw new AppError('NO_RELEVANT_CONTENT', selectedDocuments.length ? 'I could not find relevant information in the selected documents.' : 'I could not find relevant information in your ready documents.', 404);
  const sourceDocs = selectedDocuments.length ? selectedDocuments : await documents().find({ _id: { $in: relevant.map((chunk) => chunk.documentId) }, userId: userObjectId(userId), status: 'ready' }).toArray();
  const names = new Map(sourceDocs.map((document) => [document._id.toString(), document.originalName]));
  const sources = relevant.map((chunk) => ({ documentId: chunk.documentId, filename: names.get(chunk.documentId.toString()) || 'Unknown document', pageNumber: chunk.pageNumber }));
  const context = relevant.map((chunk, index) => `[Source ${index + 1}: ${names.get(chunk.documentId.toString()) || 'Document'}, page ${chunk.pageNumber || 'unknown'}]\n${chunk.text}`).join('\n\n');
  return { context, sources };
}
async function saveUserMessage(chat, userId, content) {
  const userMessage = { chatId: chat._id, userId: userObjectId(userId), role: 'user', content, sources: [], createdAt: new Date() };
  await messages().insertOne(userMessage);
  if (chat.title === 'New conversation') await chats().updateOne({ _id: chat._id }, { $set: { title: titleFrom(content), updatedAt: new Date() } });
}
export async function listChats(req, res) { const data = await chats().find({ userId: userObjectId(req.user._id) }).sort({ updatedAt: -1 }).limit(100).toArray(); res.json({ success: true, data: { chats: data } }); }
export async function createChat(req, res) { const { title = 'New conversation', documentIds, documentId } = chatSchema.parse(req.body); const requestedIds = documentIds ?? (documentId ? [documentId] : []); if (requestedIds.some((id) => !ObjectId.isValid(id))) throw new AppError('VALIDATION_ERROR', 'A selected document ID is invalid.', 400); const scopedDocumentIds = [...new Set(requestedIds)].map((id) => new ObjectId(id)); if (scopedDocumentIds.length && await documents().countDocuments({ _id: { $in: scopedDocumentIds }, userId: userObjectId(req.user._id) }) !== scopedDocumentIds.length) throw new AppError('DOCUMENT_NOT_FOUND', 'One or more selected documents could not be found.', 404); const chat = { userId: userObjectId(req.user._id), title, documentIds: scopedDocumentIds, createdAt: new Date(), updatedAt: new Date() }; const { insertedId } = await chats().insertOne(chat); res.status(201).json({ success: true, data: { chat: { ...chat, _id: insertedId } } }); }
export async function renameChat(req, res) { const { title } = titleSchema.parse(req.body); const result = await chats().findOneAndUpdate(chatFilter(req.params.id, req.user._id), { $set: { title, updatedAt: new Date() } }, { returnDocument: 'after' }); if (!result) throw new AppError('CHAT_NOT_FOUND', 'Chat could not be found.', 404); res.json({ success: true, data: { chat: result } }); }
export async function getChatMessages(req, res) { const chat = await chats().findOne(chatFilter(req.params.id, req.user._id)); if (!chat) throw new AppError('CHAT_NOT_FOUND', 'Chat could not be found.', 404); const data = await messages().find({ chatId: chat._id, userId: userObjectId(req.user._id) }).sort({ createdAt: 1 }).limit(500).toArray(); res.json({ success: true, data: { chat, messages: data } }); }
export async function sendMessage(req, res) { const { message } = messageSchema.parse(req.body); const chat = await chats().findOne(chatFilter(req.params.id, req.user._id)); if (!chat) throw new AppError('CHAT_NOT_FOUND', 'Chat could not be found.', 404); await saveUserMessage(chat, req.user._id, message); const { context, sources } = await prepareAnswer(chat, req.user._id, message); const answer = await answerQuestion({ question: message, context }); const assistantMessage = { chatId: chat._id, userId: userObjectId(req.user._id), role: 'assistant', content: answer, sources, createdAt: new Date() }; const { insertedId } = await messages().insertOne(assistantMessage); await chats().updateOne({ _id: chat._id }, { $set: { updatedAt: new Date() } }); res.status(201).json({ success: true, data: { message: { ...assistantMessage, _id: insertedId } } }); }
export async function streamMessage(req, res) { const { message } = messageSchema.parse(req.body); const chat = await chats().findOne(chatFilter(req.params.id, req.user._id)); if (!chat) throw new AppError('CHAT_NOT_FOUND', 'Chat could not be found.', 404); await saveUserMessage(chat, req.user._id, message); const { context, sources } = await prepareAnswer(chat, req.user._id, message); const startStream = () => { if (!res.headersSent) res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); }; const abortController = new AbortController(); req.on('aborted', () => abortController.abort()); res.on('close', () => { if (!res.writableEnded) abortController.abort(); }); try { const answer = await streamAnswer({ question: message, context, signal: abortController.signal, onToken: (token) => { startStream(); if (!res.writableEnded) res.write(`data: ${JSON.stringify({ token })}\n\n`); } }); if (abortController.signal.aborted) return; startStream(); const assistantMessage = { chatId: chat._id, userId: userObjectId(req.user._id), role: 'assistant', content: answer, sources, createdAt: new Date() }; const { insertedId } = await messages().insertOne(assistantMessage); const updatedChat = await chats().findOneAndUpdate({ _id: chat._id }, { $set: { updatedAt: new Date(), title: chat.title === 'New conversation' ? titleFrom(message) : chat.title } }, { returnDocument: 'after' }); res.write(`event: done\ndata: ${JSON.stringify({ message: { ...assistantMessage, _id: insertedId }, chat: updatedChat })}\n\n`); res.end(); } catch (error) { if (abortController.signal.aborted) return; if (!res.headersSent) throw error; console.error(`[chat:${chat._id}] stream failed:`, error); res.write(`event: error\ndata: ${JSON.stringify({ message: 'The response was interrupted. Please try again.' })}\n\n`); res.end(); } }
export async function deleteChat(req, res) { const chat = await chats().findOne(chatFilter(req.params.id, req.user._id)); if (!chat) throw new AppError('CHAT_NOT_FOUND', 'Chat could not be found.', 404); await messages().deleteMany({ chatId: chat._id, userId: userObjectId(req.user._id) }); await chats().deleteOne({ _id: chat._id }); res.status(204).send(); }
