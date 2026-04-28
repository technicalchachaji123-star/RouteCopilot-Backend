import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { MapsController } from './maps.controller';

const router = Router();

// Protect endpoints
router.use(requireAuth);

// Get list of all offline maps available for download
router.get('/', MapsController.getAvailableMaps);

// Register that a driver is downloading a map
router.post('/download', MapsController.registerDownload);

export default router;
