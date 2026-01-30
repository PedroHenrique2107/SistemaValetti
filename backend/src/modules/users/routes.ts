import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMINISTRADOR', 'SUPER_ADMIN', 'GERENTE_OPERACIONAL'), getUsers);
router.get('/:id', getUser);
router.post('/', authorize('ADMINISTRADOR', 'SUPER_ADMIN'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('ADMINISTRADOR', 'SUPER_ADMIN'), deleteUser);
router.patch('/:id/status', authorize('ADMINISTRADOR', 'SUPER_ADMIN'), updateUserStatus);

export default router;
