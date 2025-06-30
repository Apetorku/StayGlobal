import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { clerkMiddleware } from '@clerk/express';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
app.use(clerkMiddleware());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Apartment Booking API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
import apartmentRoutes from './routes/apartments';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import paymentRoutes from './routes/paymentRoutes';
import userPaymentRoutes from './routes/userPaymentRoutes';
import identityVerificationRoutes from './routes/identityVerificationRoutes';

app.use('/api/apartments', (req, res, next) => {
  console.log(`🏠 Apartment route hit: ${req.method} ${req.path}`);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Request headers:', req.headers);
  next();
}, apartmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user-payments', userPaymentRoutes);
app.use('/api/identity-verification', identityVerificationRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - use a different pattern to avoid path-to-regexp issues
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
