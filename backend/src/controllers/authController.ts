import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import axios from 'axios';
import multer from 'multer';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'your-fast2sms-api-key';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
        message: `Your RoadGuard verification code is: ${otp}. Valid for 5 minutes.`,
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

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    // Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true
    });

    // Set OTP expiration time (5 minutes from now)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Find user
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    // Update user's OTP
    await User.updateOne(
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
    console.error("Error in sendOTP:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to send OTP",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    console.log('Verifying OTP for:', mobileNumber);

    const user = await User.findOne({ mobileNumber });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      console.log('No OTP found for user');
      return res.status(400).json({ error: 'No OTP found. Please request a new OTP.' });
    }

    if (user.otp.code !== otp) {
      console.log('Invalid OTP provided');
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > user.otp.expiresAt) {
      console.log('OTP has expired');
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // Clear OTP after successful verification
    await User.updateOne(
      { _id: user._id },
      { $unset: { otp: 1 } }
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        mobileNumber: user.mobileNumber,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        vehicles: user.vehicles,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to verify OTP",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, name, email, role, vehicles } = req.body;

    // Validate required fields
    if (!mobileNumber) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          mobileNumber: !mobileNumber ? "Mobile number is required" : undefined
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { mobileNumber },
        ...(email ? [{ email }] : [])  // Only check email if provided
      ] 
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        details: {
          mobileNumber: existingUser.mobileNumber === mobileNumber ? "Mobile number already registered" : undefined,
          email: email && existingUser.email === email ? "Email already registered" : undefined
        }
      });
    }

    // Create new user
    const user = new User({
      mobileNumber,
      name: name || undefined,  // Only set if provided
      email: email || undefined,  // Only set if provided
      role: role || 'user',
      vehicles: vehicles || []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        mobileNumber: user.mobileNumber,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        vehicles: user.vehicles,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to register user",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const changeMobileNumber = async (req: Request, res: Response) => {
  try {
    const { currentMobileNumber, newMobileNumber } = req.body;
    const userId = req.user?.userId; // From auth middleware

    // Find user by current mobile number
    const user = await User.findOne({ mobileNumber: currentMobileNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new mobile number is already registered
    const existingUser = await User.findOne({ mobileNumber: newMobileNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'This mobile number is already registered' });
    }

    // Update mobile number
    user.mobileNumber = newMobileNumber;
    await user.save();

    // Generate new token with updated mobile number
    const token = jwt.sign(
      { 
        userId: user._id, 
        mobileNumber: user.mobileNumber,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Mobile number updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    console.error("Error in changeMobileNumber:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to change mobile number",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const { name, email, mobileNumber } = req.body;
    const userId = req.user?.userId; // From auth middleware

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new mobile number is already registered by another user
    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const existingUser = await User.findOne({ 
        mobileNumber,
        _id: { $ne: userId } // Exclude current user
      });
      if (existingUser) {
        return res.status(400).json({ error: 'This mobile number is already registered' });
      }
    }

    // Update user information
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobileNumber) user.mobileNumber = mobileNumber;

    await user.save();

    // Generate new token with updated information
    const token = jwt.sign(
      { 
        userId: user._id, 
        mobileNumber: user.mobileNumber,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "User information updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    console.error("Error in updateUserInfo:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update user information",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store only the relative path in the database
    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();

    // Generate new token
    const token = jwt.sign(
      { 
        userId: user._id, 
        mobileNumber: user.mobileNumber,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Profile photo updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        vehicles: user.vehicles,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error("Error in uploadProfilePhoto:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to upload profile photo",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 