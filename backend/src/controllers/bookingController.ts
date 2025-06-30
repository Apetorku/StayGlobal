import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/Booking';
import Apartment from '../models/Apartment';
import { syncUserWithClerk } from '../utils/userUtils';
import biometricService from '../services/biometricService';

// Create new booking
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      apartmentId,
      checkIn,
      checkOut,
      guests,
      paymentMethod,
      specialRequests
    } = req.body;

    // Sync user with Clerk to get latest data
    const user = await syncUserWithClerk(req.user.clerkId);

    // Validate apartment exists and is available
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      res.status(404).json({ error: 'Apartment not found' });
      return;
    }

    if (!apartment.isActive) {
      res.status(400).json({ error: 'Apartment is not available' });
      return;
    }

    if (apartment.availableRooms < 1) {
      res.status(400).json({ error: 'No rooms available' });
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate < now) {
      res.status(400).json({ error: 'Check-in date cannot be in the past' });
      return;
    }

    if (checkOutDate <= checkInDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date' });
      return;
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      apartmentId,
      bookingStatus: { $in: ['confirmed', 'completed'] },
      $or: [
        {
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        {
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ]
    });

    if (overlappingBookings.length >= apartment.availableRooms) {
      res.status(400).json({ error: 'No rooms available for selected dates' });
      return;
    }

    // Calculate total amount
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * apartment.price;

    // Create booking
    const booking = new Booking({
      apartmentId,
      guestId: user.clerkId,
      guestName: user.fullName,
      guestEmail: user.email,
      guestPhone: user.phone || '',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      paymentMethod,
      specialRequests
    });

    await booking.save();

    // Update apartment available rooms
    apartment.availableRooms -= 1;
    await apartment.save();

    // Populate apartment details for response
    await booking.populate('apartmentId', 'title location images');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Get user's bookings
export const getMyBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { guestId: req.user.clerkId };
    if (status) {
      filter.bookingStatus = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('apartmentId', 'title location images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch your bookings' });
  }
};

// Get single booking by ID
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('apartmentId', 'title location images price ownerName ownerEmail');

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check if user owns this booking or is the apartment owner
    const apartment = await Apartment.findById(booking.apartmentId);
    const isOwner = apartment && apartment.ownerId === req.user.clerkId;
    const isGuest = booking.guestId === req.user.clerkId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isGuest && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to view this booking' });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check if user owns this booking
    if (booking.guestId !== req.user.clerkId && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to cancel this booking' });
      return;
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === 'cancelled') {
      res.status(400).json({ error: 'Booking is already cancelled' });
      return;
    }

    if (booking.bookingStatus === 'completed') {
      res.status(400).json({ error: 'Cannot cancel completed booking' });
      return;
    }

    // Check cancellation policy (24 hours before check-in)
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 24) {
      res.status(400).json({
        error: 'Cannot cancel booking less than 24 hours before check-in'
      });
      return;
    }

    // Cancel booking
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Restore apartment availability
    const apartment = await Apartment.findById(booking.apartmentId);
    if (apartment) {
      apartment.availableRooms += 1;
      await apartment.save();
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Get all bookings for apartments owned by the current user
export const getOwnerBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 100, status } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // First, get all apartments owned by the current user
    const userApartments = await Apartment.find({ ownerId: req.user.clerkId }).select('_id');
    const apartmentIds = userApartments.map(apt => apt._id);

    if (apartmentIds.length === 0) {
      // User has no apartments, return empty result
      res.json({
        bookings: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
      return;
    }

    // Build filter for bookings
    const filter: Record<string, unknown> = { apartmentId: { $in: apartmentIds } };
    if (status) {
      filter.bookingStatus = status;
    }

    // Get bookings for all user's apartments
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('apartmentId', 'title location images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ error: 'Failed to fetch owner bookings' });
  }
};

// Get bookings for apartment owner
export const getApartmentBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apartmentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verify apartment ownership
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      res.status(404).json({ error: 'Apartment not found' });
      return;
    }

    if (apartment.ownerId !== req.user.clerkId && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to view these bookings' });
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { apartmentId };
    if (status) {
      filter.bookingStatus = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching apartment bookings:', error);
    res.status(500).json({ error: 'Failed to fetch apartment bookings' });
  }
};

// Update booking payment status (for payment processing)
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Only allow certain payment status updates
    const allowedStatuses = ['paid', 'failed', 'refunded'];
    if (!allowedStatuses.includes(paymentStatus)) {
      res.status(400).json({ error: 'Invalid payment status' });
      return;
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.json({
      message: 'Payment status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

// Get booking by ticket code
export const getBookingByTicketCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketCode } = req.params;

    const booking = await Booking.findOne({ ticketCode })
      .populate('apartmentId', 'title')
      .lean();

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check if user is the owner of the apartment or admin
    if (req.user.role !== 'admin') {
      const apartment = await Apartment.findById(booking.apartmentId);
      if (!apartment || apartment.ownerId !== req.user.clerkId) {
        res.status(403).json({ error: 'Not authorized to view this booking' });
        return;
      }
    }

    // Add apartment title to response
    const bookingWithDetails = {
      ...booking,
      apartmentTitle: typeof booking.apartmentId === 'object' && 'title' in booking.apartmentId
        ? (booking.apartmentId as { title: string }).title
        : 'Unknown Apartment'
    };

    res.json(bookingWithDetails);
  } catch (error) {
    console.error('Error fetching booking by ticket code:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Update booking status (for check-in/check-out)
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'checked-in', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid booking status' });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check if user is the owner of the apartment or admin
    if (req.user.role !== 'admin') {
      const apartment = await Apartment.findById(booking.apartmentId);
      if (!apartment || apartment.ownerId !== req.user.clerkId) {
        res.status(403).json({ error: 'Not authorized to update this booking' });
        return;
      }
    }

    // Update booking status
    booking.bookingStatus = status;

    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// Create secure booking with biometric verification
export const createSecureBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      apartmentId,
      checkIn,
      checkOut,
      guests,
      paymentMethod,
      specialRequests,
      fingerprintData // Required for payment authorization
    } = req.body;

    // Sync user with Clerk to get latest data
    const user = await syncUserWithClerk(req.user.clerkId);

    // Verify user's identity is verified
    if (!user.identityVerification?.isVerified) {
      res.status(403).json({
        error: 'Identity verification required',
        message: 'You must complete identity verification before making bookings'
      });
      return;
    }

    // Verify fingerprint for payment authorization
    if (!fingerprintData) {
      res.status(400).json({
        error: 'Biometric verification required',
        message: 'Fingerprint verification is required for payment authorization'
      });
      return;
    }

    try {
      const biometricResult = await biometricService.verifyFingerprint({
        userId: user.clerkId,
        fingerprintData,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.headers['x-session-id'] as string || 'unknown'
        }
      });

      if (!biometricResult.isMatch) {
        res.status(401).json({
          error: 'Biometric verification failed',
          message: 'Fingerprint verification failed. Payment authorization denied.',
          confidence: biometricResult.confidence
        });
        return;
      }
    } catch (biometricError) {
      res.status(401).json({
        error: 'Biometric verification failed',
        message: 'Unable to verify fingerprint. Please try again.'
      });
      return;
    }

    // Validate apartment exists and is available
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      res.status(404).json({ error: 'Apartment not found' });
      return;
    }

    if (!apartment.isActive) {
      res.status(400).json({ error: 'Apartment is not available' });
      return;
    }

    // Verify apartment owner has verified payment account
    if (!apartment.ownerPaymentAccount) {
      res.status(400).json({
        error: 'Payment not available',
        message: 'Property owner has not set up payment account'
      });
      return;
    }

    // Validate dates and availability (same as regular booking)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate < now) {
      res.status(400).json({ error: 'Check-in date cannot be in the past' });
      return;
    }

    if (checkOutDate <= checkInDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date' });
      return;
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      apartmentId,
      bookingStatus: { $in: ['confirmed', 'completed'] },
      $or: [
        {
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        {
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ]
    });

    if (overlappingBookings.length >= apartment.availableRooms) {
      res.status(400).json({ error: 'No rooms available for selected dates' });
      return;
    }

    // Calculate total amount
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * apartment.price;

    // Create booking with biometric verification flag
    const booking = new Booking({
      apartmentId,
      guestId: user.clerkId,
      guestName: user.fullName,
      guestEmail: user.email,
      guestPhone: user.phone || '',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      paymentMethod,
      specialRequests,
      // Add metadata to track biometric verification
      metadata: {
        biometricVerified: true,
        verificationTimestamp: new Date(),
        paymentAuthorized: true
      }
    });

    await booking.save();

    // Update apartment available rooms
    apartment.availableRooms -= 1;
    await apartment.save();

    res.status(201).json({
      message: 'Secure booking created successfully with biometric verification',
      booking: {
        id: booking._id,
        apartmentId: booking.apartmentId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount: booking.totalAmount,
        ticketCode: booking.ticketCode,
        paymentMethod: booking.paymentMethod,
        biometricVerified: true
      },
      paymentInfo: {
        ownerPaymentAccount: apartment.ownerPaymentAccount,
        directPayment: true,
        secureTransaction: true
      }
    });

  } catch (error) {
    console.error('Error creating secure booking:', error);
    res.status(500).json({ error: 'Failed to create secure booking' });
  }
};
