import bcrypt from 'bcrypt';
const ROUNDS = 12;
export const hashPassword = (password) => bcrypt.hash(password, ROUNDS);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
