import { ObjectId } from 'mongodb';
import { db } from '../config/db.js';
export const chats = () => db().collection('chats');
export const chatFilter = (id, userId) => ({ _id: new ObjectId(id), userId: new ObjectId(userId) });
