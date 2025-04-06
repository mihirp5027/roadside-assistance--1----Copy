import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceRequest extends Document {
  userId: mongoose.Types.ObjectId;
  mechanicId: mongoose.Types.ObjectId;
  workerId?: mongoose.Types.ObjectId;
  serviceType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'pending' | 'accepted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mechanicId: {
    type: Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true
  },
  workerId: {
    type: Schema.Types.ObjectId,
    ref: 'Worker',
    required: false
  },
  serviceType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema); 