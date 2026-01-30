import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueStats,
  getOperationalStats,
  getVehicleStats,
} from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/revenue', authorize('ADMINISTRADOR', 'SUPER_ADMIN', 'FINANCEIRO'), getRevenueStats);
router.get('/operational', authorize('ADMINISTRADOR', 'SUPER_ADMIN', 'GERENTE_OPERACIONAL', 'SUPERVISOR'), getOperationalStats);
router.get('/vehicles', getVehicleStats);

export default router;
