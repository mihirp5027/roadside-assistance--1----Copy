import { Request, Response } from 'express';
import User from '../models/User';
import mongoose, { Document, Types } from 'mongoose';

// Define the Vehicle interface to match the Mongoose schema
interface Vehicle {
  _id: Types.ObjectId;
  model: string;
  make: string;
  year: string;
  color: string;
  licensePlate: string;
  isPrimary: boolean;
}

interface UserDocument extends Document {
  vehicles: Types.DocumentArray<Vehicle>;
}

// Get all vehicles for a user
export const getVehicles = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user.vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new vehicle
export const addVehicle = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { model, make, year, color, licensePlate, isPrimary } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is the first vehicle or isPrimary is true, set it as primary
    if (user.vehicles.length === 0 || isPrimary) {
      // Set all existing vehicles to non-primary
      user.vehicles.forEach(vehicle => {
        vehicle.isPrimary = false;
      });
    }

    const newVehicle = {
      _id: new mongoose.Types.ObjectId(),
      model,
      make,
      year,
      color,
      licensePlate,
      isPrimary: isPrimary || user.vehicles.length === 0
    };

    user.vehicles.push(newVehicle);
    await user.save();

    return res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a vehicle
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { vehicleId } = req.params;
    const { model, make, year, color, licensePlate, isPrimary } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const vehicleIndex = user.vehicles.findIndex(
      v => v._id.toString() === vehicleId
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // If setting this vehicle as primary, update others
    if (isPrimary) {
      user.vehicles.forEach(vehicle => {
        vehicle.isPrimary = false;
      });
    }

    // Update the vehicle properties individually
    const vehicle = user.vehicles[vehicleIndex];
    if (model) vehicle.model = model;
    if (make) vehicle.make = make;
    if (year) vehicle.year = year;
    if (color) vehicle.color = color;
    if (licensePlate) vehicle.licensePlate = licensePlate;
    if (typeof isPrimary === 'boolean') vehicle.isPrimary = isPrimary;

    await user.save();
    return res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { vehicleId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const vehicleIndex = user.vehicles.findIndex(
      v => v._id.toString() === vehicleId
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // If deleting primary vehicle and there are other vehicles, make the first one primary
    if (user.vehicles[vehicleIndex].isPrimary && user.vehicles.length > 1) {
      const nextVehicle = user.vehicles.find((_, index) => index !== vehicleIndex);
      if (nextVehicle) {
        nextVehicle.isPrimary = true;
      }
    }

    user.vehicles.splice(vehicleIndex, 1);
    await user.save();

    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 