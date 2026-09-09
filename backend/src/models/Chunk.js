import { db } from '../config/db.js';
export const chunks = () => db().collection('chunks');
