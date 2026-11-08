import { Router } from 'express';
import {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getBudgets).post(createOrUpdateBudget);
router.route('/:id').delete(deleteBudget);

export default router;
