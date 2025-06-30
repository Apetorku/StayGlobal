import express from 'express';
import {
  createBooking,
  createSecureBooking,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  getBookingByTicketCode,
  updateBookingStatus,
  cancelBooking,
  getApartmentBookings,
  updatePaymentStatus
} from '../controllers/bookingController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBooking } from '../middleware/validation';
import { requireIdentityVerification, requireBiometricVerification } from '../middleware/verification';

const router = express.Router();

// All booking routes require authentication
router.use(requireAuth);

// Guest routes
router.post('/', validateBooking, createBooking);
router.post('/secure',
  requireIdentityVerification,
  requireBiometricVerification,
  validateBooking,
  createSecureBooking
); // New secure booking with biometric verification
router.get('/my', getMyBookings);
router.patch('/:id/cancel', cancelBooking);

// Owner routes (specific routes must come before /:id)
router.get('/owner', requireRole(['owner', 'admin']), getOwnerBookings); // Get all bookings for owner's properties
router.get('/ticket/:ticketCode', requireRole(['owner', 'admin']), getBookingByTicketCode);
router.get('/apartment/:apartmentId', requireRole(['owner', 'admin']), getApartmentBookings);
router.patch('/:id/status', requireRole(['owner', 'admin']), updateBookingStatus);

// Generic ID route (must come last)
router.get('/:id', getBookingById);

// Admin routes (for payment processing)
router.patch('/:id/payment', requireRole(['admin']), updatePaymentStatus);

export default router;
