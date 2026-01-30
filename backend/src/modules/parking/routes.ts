import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getCheckIns,
  getCheckOuts,
  getCheckIn,
  getCheckOut,
  requestVehicleExit,
  getParkingStatus,
} from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

// Check-in
router.post('/check-in', checkIn);
router.get('/check-in', getCheckIns);
router.get('/check-in/:id', getCheckIn);

// Check-out
router.post('/check-out', checkOut);
router.get('/check-out', getCheckOuts);
router.get('/check-out/:id', getCheckOut);

// Operações
router.post('/request-exit', requestVehicleExit);
router.get('/status', getParkingStatus);

export default router;
