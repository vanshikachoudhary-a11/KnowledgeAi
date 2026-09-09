import { z } from 'zod';
import * as authService from '../services/authService.js';
const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
export async function register(req, res) { const data = credentials.extend({ name: z.string().trim().min(2).max(80) }).parse(req.body); res.status(201).json({ success: true, data: await authService.register(data) }); }
export async function login(req, res) { const data = credentials.parse(req.body); res.json({ success: true, data: await authService.login(data) }); }
