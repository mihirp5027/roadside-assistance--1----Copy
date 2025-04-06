import { Request, Response } from 'express';
import ServiceRequest from '../models/ServiceRequest';
import Worker from '../models/Worker';
import mongoose from 'mongoose';

// Get all pending service requests
export const getPendingServiceRequests = async (req: Request, res: Response) => {
  try {
    const serviceRequests = await ServiceRequest.find({ status: 'pending' })
      .populate('userId', 'name mobileNumber')
      .populate('mechanicId', 'name mobileNumber');
    
    res.json(serviceRequests);
  } catch (error: any) {
    console.error('Error fetching pending service requests:', error);
    res.status(500).json({ 
      message: 'Error fetching pending service requests', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Accept a service request (by admin)
export const acceptServiceRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    const serviceRequest = await ServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Service request is not in pending status' });
    }
    
    serviceRequest.status = 'accepted';
    await serviceRequest.save();
    
    res.json(serviceRequest);
  } catch (error: any) {
    console.error('Error accepting service request:', error);
    res.status(500).json({ 
      message: 'Error accepting service request', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Get all available workers
export const getAvailableWorkers = async (req: Request, res: Response) => {
  try {
    const workers = await Worker.find({ status: 'active' })
      .select('name mobileNumber specialization');
    
    res.json(workers);
  } catch (error: any) {
    console.error('Error fetching available workers:', error);
    res.status(500).json({ 
      message: 'Error fetching available workers', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Assign a worker to a service request (by admin)
export const assignWorkerToRequest = async (req: Request, res: Response) => {
  try {
    const { requestId, workerId } = req.params;
    
    // Convert workerId string to ObjectId
    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    
    // Check if the worker exists and is active
    const worker = await Worker.findOne({ _id: workerObjectId, status: 'active' });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found or not active' });
    }
    
    const serviceRequest = await ServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    if (serviceRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Service request is not in accepted status' });
    }
    
    serviceRequest.workerId = workerObjectId;
    serviceRequest.status = 'assigned';
    serviceRequest.assignedAt = new Date();
    await serviceRequest.save();
    
    res.json(serviceRequest);
  } catch (error: any) {
    console.error('Error assigning worker to service request:', error);
    res.status(500).json({ 
      message: 'Error assigning worker to service request', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Get all service requests with their status
export const getAllServiceRequests = async (req: Request, res: Response) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate('userId', 'name mobileNumber')
      .populate('mechanicId', 'name mobileNumber')
      .populate('workerId', 'name mobileNumber specialization');
    
    res.json(serviceRequests);
  } catch (error: any) {
    console.error('Error fetching all service requests:', error);
    res.status(500).json({ 
      message: 'Error fetching all service requests', 
      error: error?.message || 'Unknown error' 
    });
  }
}; 