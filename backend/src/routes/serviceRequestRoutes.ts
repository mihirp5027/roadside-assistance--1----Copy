import express from 'express';
import { authenticateWorker, authenticateMechanic } from '../middleware/auth';
import { 
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  assignWorkerToRequest,
  updateServiceRequestStatus,
  getWorkerAssignedRequests
} from '../controllers/serviceRequestController';

const router = express.Router();

// Public routes
router.post('/', createServiceRequest);

// Mechanic routes
router.get('/', authenticateMechanic, getServiceRequests);
router.get('/:id', authenticateMechanic, getServiceRequestById);
router.patch('/:requestId/assign/:workerId', authenticateMechanic, assignWorkerToRequest);

// Worker routes
router.get('/worker', authenticateWorker, getWorkerAssignedRequests);
router.patch('/:requestId/status', authenticateWorker, updateServiceRequestStatus);

export default router; 