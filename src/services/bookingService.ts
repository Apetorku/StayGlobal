const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Booking {
  _id: string;
  apartmentId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'paystack' | 'momo' | 'card' | 'paypal' | 'bank_transfer';
  bookingStatus: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'checked-in';
  ticketCode: string;
  roomNumber?: number; // Assigned room number
  checkInTime?: string; // Actual check-in time
  checkOutTime?: string; // Actual check-out time
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  apartmentId?: {
    title: string;
    location: {
      country: string;
      region: string;
      town: string;
    };
    images: string[];
    price: number;
  };
}

export interface CreateBookingData {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: 'paystack' | 'momo' | 'card' | 'paypal' | 'bank_transfer';
  specialRequests?: string;
}

export interface BookingResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const bookingService = {
  async createBooking(bookingData: CreateBookingData, token: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create booking');
    }
    
    return response.json();
  },

  async getMyBookings(token: string, page = 1, limit = 10, status?: string): Promise<BookingResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${API_BASE_URL}/bookings/my?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch bookings');
    }
    
    return response.json();
  },

  async getBookingById(id: string, token: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch booking');
    }
    
    return response.json();
  },

  async cancelBooking(id: string, token: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel booking');
    }
    
    return response.json();
  },

  async getApartmentBookings(apartmentId: string, token: string, page = 1, limit = 10): Promise<BookingResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/bookings/apartment/${apartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch apartment bookings');
    }

    return response.json();
  },

  async getOwnerBookings(token: string, page = 1, limit = 100): Promise<BookingResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      owner: 'true', // Flag to get owner's bookings
    });

    const response = await fetch(`${API_BASE_URL}/bookings/owner?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch owner bookings');
    }

    return response.json();
  },

  async getBookingByTicketCode(ticketCode: string, token: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/ticket/${ticketCode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Booking not found');
    }

    return response.json();
  },

  async updateBookingStatus(bookingId: string, status: string, token: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update booking status');
    }

    return response.json();
  },

  // Self-checkout for renters
  async selfCheckout(bookingId: string, token: string): Promise<any> {
    console.log(`🚪 Attempting self-checkout for booking: ${bookingId}`);
    console.log(`📡 API URL: ${API_BASE_URL}/bookings/${bookingId}/checkout`);

    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Failed to check out';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error(`❌ Checkout failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`✅ Checkout successful:`, result);
    return result;
  },
};
