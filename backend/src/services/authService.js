import { users } from '../models/User.js';
import { findUserByEmail } from '../models/User.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { createToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorMiddleware.js';

const publicUser = ({ _id, name, email, createdAt }) => ({ id: _id.toString(), name, email, createdAt });
export async function register({ name, email, password }) {
  if (await findUserByEmail(email)) throw new AppError('EMAIL_IN_USE', 'An account with this email already exists.', 409);
  const user = { name: name.trim(), email: email.toLowerCase(), passwordHash: await hashPassword(password), createdAt: new Date(), updatedAt: new Date() };
  const { insertedId } = await users().insertOne(user);
  return { user: publicUser({ ...user, _id: insertedId }), token: createToken(insertedId) };
}
export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !(await comparePassword(password, user.passwordHash))) throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
  return { user: publicUser(user), token: createToken(user._id) };
}
export const toPublicUser = publicUser;
