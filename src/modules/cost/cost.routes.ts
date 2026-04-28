import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { CostController } from './cost.controller';

const router = Router();

// Protect all cost endpoints
router.use(requireAuth);

// Log a new expense (fuel, toll, etc.)
router.post('/add', CostController.addCost);

// Get expense history (optionally filter by ?routeId=...)
router.get('/history', CostController.getHistory);

export default router;
