import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { TelematicsController } from './telematics.controller';

const router = Router();

// Protect endpoints
router.use(requireAuth);

// Get live telemetry for the active navigation dashboard
router.get('/live', TelematicsController.getLiveDashboard);

export default router;
