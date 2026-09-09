import { toPublicUser } from '../services/authService.js';
export async function getMe(req, res) { res.json({ success: true, data: { user: toPublicUser(req.user) } }); }
