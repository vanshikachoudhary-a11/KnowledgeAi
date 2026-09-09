import { ObjectId } from 'mongodb';
import { db } from '../config/db.js';
export const documents = () => db().collection('documents');
export const documentFilter = (id, userId) => ({ _id: new ObjectId(id), userId: new ObjectId(userId) });
