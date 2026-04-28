import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { UserController } from './user.controller';

const router = Router();

// Protect endpoints
router.use(requireAuth);

// Get basic user profile
router.get('/me', UserController.getProfile);

// Get Driver Performance Rating & Analytics
router.get('/performance', UserController.getPerformanceDashboard);

export default router;
