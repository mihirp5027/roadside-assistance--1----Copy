import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import serviceRequestRoutes from './routes/serviceRequestRoutes';
import mechanicAuthRoutes from './routes/mechanicAuthRoutes';
import workerAuthRoutes from './routes/workerAuthRoutes';
import mechanicRoutes from './routes/mechanicRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/mechanic-auth', mechanicAuthRoutes);
app.use('/api/worker-auth', workerAuthRoutes);
app.use('/api/mechanic', mechanicRoutes);

export default app; 