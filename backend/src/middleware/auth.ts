import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import Mechanic from '../models/Mechanic';
import Worker from '../models/Worker';

interface JwtPayload {
  userId: string;
  mobileNumber: string;
  role: string;
}

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const authenticateMechanic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First authenticate the token
    await authenticateToken(req, res, async () => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Then check if the user is a mechanic
      const mechanic = await Mechanic.findOne({ userId: req.user.userId });
      if (!mechanic) {
        return res.status(403).json({ message: 'Not authorized as mechanic' });
      }

      // Add mechanic role to request
      req.user.role = 'mechanic';
      next();
    });
  } catch (error) {
    console.error('Mechanic authentication error:', error);
    return res.status(403).json({ message: 'Not authorized as mechanic' });
  }
};

export const authenticateWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First authenticate the token
    await authenticateToken(req, res, async () => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Then check if the user is a worker
      const worker = await Worker.findOne({ userId: req.user.userId });
      if (!worker) {
        return res.status(403).json({ message: 'Not authorized as worker' });
      }

      // Add worker role to request
      req.user.role = 'worker';
      next();
    });
  } catch (error) {
    console.error('Worker authentication error:', error);
    return res.status(403).json({ message: 'Not authorized as worker' });
  }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First authenticate the token
    await authenticateToken(req, res, async () => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Check if the user has admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
      }

      next();
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
}; 