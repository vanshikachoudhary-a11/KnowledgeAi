import 'dotenv/config';

const required = ['JWT_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);

export const env = Object.freeze({
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  mongoDbName: process.env.MONGODB_DB_NAME || 'knowledge_ai',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  maxFileSize: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
  geminiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.6-flash',
});
