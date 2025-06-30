import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  apartmentId: mongoose.Types.ObjectId;
  guestId: string; // Clerk user ID
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'paystack' | 'momo' | 'card' | 'paypal' | 'bank_transfer';
  paymentId?: mongoose.Types.ObjectId; // Reference to Payment document
  bookingStatus: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  ticketCode: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema({
  apartmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Apartment',
    required: [true, 'Apartment ID is required'],
    index: true
  },
  guestId: {
    type: String,
    required: [true, 'Guest ID is required'],
    index: true
  },
  guestName: {
    type: String,
    required: [true, 'Guest name is required'],
    trim: true
  },
  guestEmail: {
    type: String,
    required: [true, 'Guest email is required'],
    trim: true,
    lowercase: true
  },
  guestPhone: {
    type: String,
    required: [true, 'Guest phone is required'],
    trim: true
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required'],
    validate: {
      validator: function(value: Date) {
        return value >= new Date();
      },
      message: 'Check-in date cannot be in the past'
    }
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required'],
    validate: {
      validator: function(this: IBooking, value: Date) {
        return value > this.checkIn;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'Must have at least 1 guest'],
    max: [20, 'Cannot exceed 20 guests']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'momo', 'card', 'paypal', 'bank_transfer'],
    required: [true, 'Payment method is required']
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    index: true
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'confirmed',
    index: true
  },
  ticketCode: {
    type: String,
    required: [true, 'Ticket code is required'],
    unique: true,
    uppercase: true,
    index: true
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for booking duration in days
BookingSchema.virtual('duration').get(function(this: IBooking) {
  const diffTime = Math.abs(this.checkOut.getTime() - this.checkIn.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
BookingSchema.index({ apartmentId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ guestId: 1, createdAt: -1 });
BookingSchema.index({ ticketCode: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ bookingStatus: 1 });

// Pre-save middleware to generate ticket code
BookingSchema.pre('save', function(this: IBooking, next) {
  if (!this.ticketCode) {
    this.ticketCode = generateTicketCode();
  }
  next();
});

function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default mongoose.model<IBooking>('Booking', BookingSchema);
