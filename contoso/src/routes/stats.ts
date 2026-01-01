import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

// GET /api/stats - Get student enrollment statistics
router.get('/', statsController.getStudentStats.bind(statsController));

export default router;
