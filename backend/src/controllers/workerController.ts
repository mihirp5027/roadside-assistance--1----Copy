import { Request, Response } from 'express';
import Worker from '../models/Worker';

// Add a new worker
export const addWorker = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, mobileNumber, specialization } = req.body;
    
    // Get mechanic ID from the request user
    const mechanicId = req.user.userId;
    
    const worker = new Worker({
      name,
      mobileNumber,
      specialization,
      mechanicId // Add the mechanic ID to the worker
    });

    await worker.save();
    res.status(201).json(worker);
  } catch (error: any) {
    console.error('Error adding worker:', error);
    res.status(500).json({ 
      message: 'Error adding worker', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Get all workers
export const getWorkers = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get mechanic ID from the request user
    const mechanicId = req.user.userId;
    
    // Fetch workers for the mechanic
    const workers = await Worker.find({ mechanicId });
    res.json(workers);
  } catch (error: any) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ 
      message: 'Error fetching workers', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Update worker status
export const updateWorkerStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { workerId } = req.params;
    const { status } = req.body;
    
    // Get mechanic ID from the request user
    const mechanicId = req.user.userId;

    // Find worker by ID and mechanic ID
    const worker = await Worker.findOne({ _id: workerId, mechanicId });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    worker.status = status;
    await worker.save();
    res.json(worker);
  } catch (error: any) {
    console.error('Error updating worker status:', error);
    res.status(500).json({ 
      message: 'Error updating worker status', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Delete a worker
export const deleteWorker = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { workerId } = req.params;
    
    // Get mechanic ID from the request user
    const mechanicId = req.user.userId;

    // Find and delete worker by ID and mechanic ID
    const worker = await Worker.findOneAndDelete({ _id: workerId, mechanicId });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ message: 'Worker deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ 
      message: 'Error deleting worker', 
      error: error?.message || 'Unknown error' 
    });
  }
}; 