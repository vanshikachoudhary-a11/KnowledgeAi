import { Router } from 'express'; import { getMe } from '../controllers/userController.js'; import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router(); router.get('/me', requireAuth, getMe); export default router;
