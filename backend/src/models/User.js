import { ObjectId } from 'mongodb';
import { db } from '../config/db.js';
export const users = () => db().collection('users');
export const findUserById = (id) => users().findOne({ _id: new ObjectId(id) });
export const findUserByEmail = (email) => users().findOne({ email: email.toLowerCase() });
