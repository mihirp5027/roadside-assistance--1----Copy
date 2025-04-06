import { Request, Response } from 'express';
import ServiceRequest from '../models/ServiceRequest';
import Worker from '../models/Worker';
import mongoose from 'mongoose';

// Get all service requests for a mechanic
export const getServiceRequests = async (req: Request, res: Response) => {
  try {
    const mechanicId = req.user?.userId;
    if (!mechanicId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const requests = await ServiceRequest.find({ mechanicId })
      .populate('userId', 'name mobileNumber')
      .populate('vehicleId')
      .populate('workerId', 'name mobileNumber specialization')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// Get a specific service request by ID
export const getServiceRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mechanicId = req.user?.userId;

    if (!mechanicId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const request = await ServiceRequest.findOne({ _id: id, mechanicId })
      .populate('userId', 'name mobileNumber')
      .populate('vehicleId')
      .populate('workerId', 'name mobileNumber specialization');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Error fetching request' });
  }
};

// Create a new service request
export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const { userId, vehicleId, serviceType, description, location } = req.body;

    const serviceRequest = new ServiceRequest({
      userId,
      vehicleId,
      serviceType,
      description,
      location,
      status: 'pending'
    });

    await serviceRequest.save();
    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Error creating request' });
  }
};

// Get requests assigned to a worker
export const getWorkerAssignedRequests = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const workerId = req.user.userId;
    console.log('Fetching requests for worker:', workerId);

    const requests = await ServiceRequest.find({ 
      workerId: new mongoose.Types.ObjectId(workerId),
      status: { $in: ['assigned', 'in_progress', 'completed'] }
    })
    .populate('userId', 'name mobileNumber')
    .populate('mechanicId', 'name mobileNumber')
    .populate('vehicleId')
    .sort({ createdAt: -1 });

    console.log('Found requests:', requests.length);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching worker requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// Update service request status
export const updateServiceRequestStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { requestId } = req.params;
    const { status } = req.body;
    const workerId = req.user.userId;

    // Validate status
    const validStatuses = ['in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the request and verify worker assignment
    const request = await ServiceRequest.findOne({ 
      _id: requestId,
      workerId: new mongoose.Types.ObjectId(workerId),
      status: status === 'in_progress' ? 'assigned' : 'in_progress'
    });

    if (!request) {
      return res.status(404).json({ 
        message: 'Service request not found or not in the correct status for this update' 
      });
    }

    // Update status
    request.status = status;
    if (status === 'completed') {
      request.completedAt = new Date();
    }
    await request.save();

    // If completing the request, update worker status
    if (status === 'completed') {
      await Worker.findByIdAndUpdate(workerId, { status: 'active' });
    }

    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// Assign worker to request
export const assignWorkerToRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { requestId, workerId } = req.params;
    const mechanicId = req.user.userId;

    // First, find the worker and verify they belong to the mechanic
    const worker = await Worker.findOne({ 
      _id: workerId,
      mechanicId: new mongoose.Types.ObjectId(mechanicId),
      status: 'active' // Only active workers can be assigned
    });

    if (!worker) {
      return res.status(404).json({ 
        message: 'Worker not found or not available for assignment' 
      });
    }

    // Find the service request
    const serviceRequest = await ServiceRequest.findOne({ 
      _id: requestId, 
      mechanicId: new mongoose.Types.ObjectId(mechanicId),
      status: 'accepted' // Only accepted requests can be assigned
    });

    if (!serviceRequest) {
      return res.status(404).json({ 
        message: 'Service request not found or not in accepted status' 
      });
    }

    // Update the service request with proper ObjectId conversion
    serviceRequest.workerId = new mongoose.Types.ObjectId(workerId);
    serviceRequest.status = 'assigned';
    serviceRequest.assignedAt = new Date();

    // Update the worker's status
    worker.status = 'in_working';

    // Save both documents
    await Promise.all([
      serviceRequest.save(),
      worker.save()
    ]);

    // Return the updated request with populated fields
    const updatedRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'name mobileNumber')
      .populate('mechanicId', 'name mobileNumber')
      .populate('workerId', 'name mobileNumber specialization')
      .populate('vehicleId');

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error assigning worker to service request:', error);
    res.status(500).json({ 
      message: 'Error assigning worker to service request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 