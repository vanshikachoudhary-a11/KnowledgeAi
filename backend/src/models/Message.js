import { db } from '../config/db.js';
export const messages = () => db().collection('messages');
