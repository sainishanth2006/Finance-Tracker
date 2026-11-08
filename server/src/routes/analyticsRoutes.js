import { Router } from 'express';
import { getMonthlySummary, getTrends } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/summary', getMonthlySummary);
router.get('/trends', getTrends);

export default router;
