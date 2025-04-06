import express from 'express';
import { authenticateAdmin } from '../middleware/auth';
import {
  getPendingServiceRequests,
  acceptServiceRequest,
  getAvailableWorkers,
  assignWorkerToRequest,
  getAllServiceRequests
} from '../controllers/adminServiceRequestController';

const router = express.Router();

// Get all pending service requests
router.get('/pending', authenticateAdmin, getPendingServiceRequests);

// Accept a service request
router.post('/:requestId/accept', authenticateAdmin, acceptServiceRequest);

// Get all available workers
router.get('/workers/available', authenticateAdmin, getAvailableWorkers);

// Assign a worker to a service request
router.post('/:requestId/assign/:workerId', authenticateAdmin, assignWorkerToRequest);

// Get all service requests
router.get('/all', authenticateAdmin, getAllServiceRequests);

export default router; 