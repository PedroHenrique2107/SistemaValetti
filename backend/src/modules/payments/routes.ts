import { Router } from 'express';
import {
  createPayment,
  getPayment,
  getPayments,
  processPayment,
  cancelPayment,
} from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/:id/process', processPayment);
router.post('/:id/cancel', cancelPayment);

export default router;
