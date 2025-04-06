import express from 'express';
import { registerWorker, loginWorker, verifyWorkerOTP, sendWorkerOTP } from '../controllers/workerAuthController';
import Worker from '../models/Worker';
import { generateOTP, verifyOTP } from '../utils/otp';
import jwt from 'jsonwebtoken';
import { authenticateWorker } from '../middleware/auth';
import { 
  getWorkerAssignedRequests,
  updateServiceRequestStatus
} from '../controllers/serviceRequestController';

const router = express.Router();

// Register a new worker
router.post('/register', registerWorker);

// Login worker with password
router.post('/login', loginWorker);

// Check if worker exists by mobile number
router.get('/check/:mobileNumber', async (req, res) => {
  try {
    const { mobileNumber } = req.params;
    const worker = await Worker.findOne({ mobileNumber });
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.status(200).json({ exists: true });
  } catch (error) {
    console.error('Error checking worker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP
router.post('/otp/send', async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    // Find worker by mobile number from workers collection
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found with this mobile number' });
    }

    // Generate OTP
    const { otp, expiresAt } = generateOTP();

    // Log OTP details in terminal
    console.log('\x1b[36m%s\x1b[0m', '\n=== Worker OTP Details ===');
    console.log('\x1b[33m%s\x1b[0m', 'Worker Name:', worker.name);
    console.log('\x1b[33m%s\x1b[0m', 'Mobile Number:', mobileNumber);
    console.log('\x1b[32m%s\x1b[0m', 'OTP:', otp);
    console.log('\x1b[33m%s\x1b[0m', 'Expires At:', new Date(expiresAt).toLocaleString());
    console.log('\x1b[36m%s\x1b[0m', '========================\n');

    // Save OTP to worker document
    await Worker.updateOne(
      { _id: worker._id },
      {
        $set: {
          otp: {
            code: otp,
            expiresAt
          }
        }
      }
    );

    // In development, send OTP in response
    res.status(200).json({ 
      message: 'OTP sent successfully',
      otp: otp // Only for development
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    // Find worker by mobile number from workers collection
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found with this mobile number' });
    }

    // Log verification attempt
    console.log('\x1b[36m%s\x1b[0m', '\n=== OTP Verification Attempt ===');
    console.log('\x1b[33m%s\x1b[0m', 'Worker Name:', worker.name);
    console.log('\x1b[33m%s\x1b[0m', 'Mobile Number:', mobileNumber);
    console.log('\x1b[32m%s\x1b[0m', 'Entered OTP:', otp);
    console.log('\x1b[32m%s\x1b[0m', 'Stored OTP:', worker.otp?.code);
    console.log('\x1b[36m%s\x1b[0m', '============================\n');

    // Verify OTP
    if (!worker.otp || !worker.otp.code || worker.otp.code !== otp || new Date() > new Date(worker.otp.expiresAt)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    await Worker.updateOne(
      { _id: worker._id },
      {
        $unset: { otp: "" },
        $set: { isVerified: true }
      }
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        workerId: worker._id,
        mobileNumber: worker.mobileNumber,
        role: 'worker',
        mechanicId: worker.mechanicId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return worker data and token
    res.status(200).json({
      worker: {
        _id: worker._id,
        name: worker.name,
        mobileNumber: worker.mobileNumber,
        specialization: worker.specialization,
        status: worker.status,
        mechanicId: worker.mechanicId,
        isVerified: true
      },
      token
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Worker request management routes
router.get('/requests', authenticateWorker, getWorkerAssignedRequests);
router.patch('/requests/:requestId/status', authenticateWorker, updateServiceRequestStatus);

export default router; 