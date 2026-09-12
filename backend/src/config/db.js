import { MongoClient } from 'mongodb';
import { env } from './env.js';

let client;
let database;

export async function connectDatabase() {
  client = new MongoClient(env.mongoUri);
  await client.connect();
  database = client.db(env.mongoDbName);
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('documents').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('chunks').createIndex({ userId: 1, documentId: 1 }),
    database.collection('chunks').createIndex({ documentId: 1, chunkIndex: 1 }),
    database.collection('chats').createIndex({ userId: 1, updatedAt: -1 }),
    database.collection('chats').createIndex({ userId: 1, documentIds: 1 }),
    database.collection('messages').createIndex({ chatId: 1, createdAt: 1 }),
  ]);
  return database;
}

export function db() {
  if (!database) throw new Error('Database is not connected.');
  return database;
}

export async function closeDatabase() { if (client) await client.close(); }
