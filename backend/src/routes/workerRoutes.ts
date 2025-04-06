import express from 'express';
import { addWorker, getWorkers, updateWorkerStatus, deleteWorker } from '../controllers/workerController';
import { authenticateMechanic } from '../middleware/auth';

const router = express.Router();

// Add a new worker
router.post('/', authenticateMechanic, addWorker);

// Get all workers
router.get('/', authenticateMechanic, getWorkers);

// Update worker status
router.patch('/:workerId/status', authenticateMechanic, updateWorkerStatus);

// Delete a worker
router.delete('/:workerId', authenticateMechanic, deleteWorker);

export default router; 