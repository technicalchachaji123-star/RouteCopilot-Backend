import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { RoutesController } from './routes.controller';

const router = Router();

// Calculate optimal route (AI Engine) - OPEN TO PUBLIC FOR PROTOTYPE
router.post('/calculate', RoutesController.findMasterRoute);

// Protect remaining route endpoints (you must be logged in)
router.use(requireAuth);

// Create a new real route (after selecting the Master route)
router.post('/plan', RoutesController.createRoute);

// Get all routes for the logged-in driver
router.get('/my-routes', RoutesController.getMyRoutes);

// Update a route's status (e.g. mark it 'completed')
router.patch('/:id/status', RoutesController.updateStatus);

export default router;
