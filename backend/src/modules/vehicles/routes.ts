import { Router } from 'express';
import {
  createVehicle,
  getVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  searchByPlate,
} from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/', getVehicles);
router.get('/search', searchByPlate);
router.get('/:id', getVehicle);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', authorize('ADMINISTRADOR', 'SUPER_ADMIN'), deleteVehicle);

export default router;
