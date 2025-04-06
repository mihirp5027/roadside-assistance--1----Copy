import { Request, Response } from 'express';
import Worker from '../models/Worker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'your-fast2sms-api-key';

// Function to send OTP via SMS
const sendOTPViaSMS = async (mobileNumber: string, otp: string) => {
  try {
    if (!FAST2SMS_API_KEY || FAST2SMS_API_KEY === 'your-fast2sms-api-key') {
      console.error('Fast2SMS API key is not configured');
      throw new Error('SMS service is not configured');
    }

    console.log('Attempting to send SMS to:', mobileNumber);
    console.log('Using API key:', FAST2SMS_API_KEY.substring(0, 5) + '...');

    // Using Fast2SMS API with default sender ID
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: 'q', // Using quick route
        numbers: mobileNumber,
        message: `Your RoadGuard worker verification code is: ${otp}. Valid for 5 minutes.`,
        flash: 0
      }
    });

    console.log('Fast2SMS API Response:', response.data);

    if (!response.data.return) {
      console.error('Fast2SMS API Error:', response.data);
      throw new Error(response.data.message || 'Failed to send SMS');
    }

    return response.data;
  } catch (error) {
    console.error('Detailed error in sendOTPViaSMS:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`SMS sending failed: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
};

// Register a new worker
export const registerWorker = async (req: Request, res: Response) => {
  try {
    const { name, mobileNumber, specialization, password } = req.body;
    
    // Check if worker already exists
    const existingWorker = await Worker.findOne({ mobileNumber });
    if (existingWorker) {
      return res.status(400).json({ message: 'Worker with this mobile number already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new worker
    const worker = new Worker({
      name,
      mobileNumber,
      specialization,
      password: hashedPassword,
      isVerified: false
    });
    
    await worker.save();
    
    res.status(201).json({ message: 'Worker registered successfully' });
  } catch (error: any) {
    console.error('Error registering worker:', error);
    res.status(500).json({ 
      message: 'Error registering worker', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Login worker
export const loginWorker = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, password } = req.body;
    
    // Find worker by mobile number
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }
    
    // Check if worker has a password set
    if (!worker.password) {
      return res.status(401).json({ message: 'Account not set up. Please contact your mechanic.' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, worker.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: worker._id, 
        mobileNumber: worker.mobileNumber,
        role: 'worker'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      worker: {
        id: worker._id,
        name: worker.name,
        mobileNumber: worker.mobileNumber,
        specialization: worker.specialization,
        status: worker.status
      }
    });
  } catch (error: any) {
    console.error('Error logging in worker:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error?.message || 'Unknown error' 
    });
  }
};

// Send OTP to worker
export const sendWorkerOTP = async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    // Find worker by mobile number
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found with this mobile number' });
    }

    // Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true
    });

    // Set OTP expiration time (5 minutes from now)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Update worker's OTP
    await Worker.updateOne(
      { mobileNumber },
      {
        $set: {
          "otp.code": otp,
          "otp.expiresAt": otpExpiresAt,
        },
      }
    );

    // For development/testing, log the OTP instead of sending SMS
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode - OTP for ${mobileNumber}: ${otp}`);
      return res.json({ message: "OTP sent successfully (development mode)" });
    }

    // Send OTP via SMS
    await sendOTPViaSMS(mobileNumber, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in sendWorkerOTP:", error);
    res.status(500).json({ 
      message: 'Error sending OTP', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Verify worker OTP
export const verifyWorkerOTP = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    
    // Find worker
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Check if OTP exists and is valid
    if (!worker.otp || !worker.otp.code || !worker.otp.expiresAt) {
      return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
    }

    if (worker.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > worker.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Clear OTP after successful verification
    await Worker.updateOne(
      { _id: worker._id },
      { $unset: { otp: 1 } }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: worker._id, 
        mobileNumber: worker.mobileNumber,
        role: 'worker',
        mechanicId: worker.mechanicId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'OTP verified successfully',
      token,
      worker: {
        id: worker._id,
        name: worker.name,
        mobileNumber: worker.mobileNumber,
        specialization: worker.specialization,
        status: worker.status
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      message: 'Error verifying OTP', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}; 