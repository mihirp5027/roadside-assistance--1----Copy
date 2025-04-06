import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
  name: string;
  mobileNumber: string;
  specialization: string;
  status: 'active' | 'inactive' | 'in_working';
  mechanicId: mongoose.Types.ObjectId;
  password?: string; // For worker authentication
  isVerified: boolean;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkerSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'in_working'],
    default: 'active'
  },
  mechanicId: {
    type: Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true
  },
  password: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IWorker>('Worker', WorkerSchema); 