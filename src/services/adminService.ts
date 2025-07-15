const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://your-backend-url.vercel.app/api' : 'http://localhost:5000/api');

console.log('🔧 Admin Service API_BASE_URL:', API_BASE_URL);

export interface AdminStats {
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  totalApartments: number;
  activeApartments: number;
  activeOwners: number;
  totalOwners: number;
  pendingReports: number;
  totalBookings: number;
  averageRating: number;
}

export interface CommissionRecord {
  _id: string;
  bookingId: string;
  apartmentId: string;
  apartmentTitle: string;
  ownerId: string;
  ownerName: string;
  guestId: string;
  guestName: string;
  roomPrice: number;
  commissionRate: number; // 5%
  commissionAmount: number;
  bookingDate: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface AdminApartment {
  _id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  location: {
    town: string;
    region: string;
    country: string;
  };
  totalRooms: number;
  availableRooms: number;
  price: number;
  totalBookings: number;
  rating: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastBooking?: string;
}

export interface AdminOwner {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  apartmentCount: number;
  totalBookings: number;
  totalEarnings: number;
  commissionPaid: number;
  createdAt: string;
  isVerified: boolean;
  identityVerified: boolean;
  paymentVerified: boolean;
  verificationLevel: 'none' | 'id_submitted' | 'biometric_pending' | 'fully_verified' | 'rejected';
  status: 'active' | 'suspended';
}

class AdminService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('🔗 Admin API Request:', fullUrl);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        console.error('❌ Admin API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  }

  // Setup admin user (for bamenorhu8@gmail.com only)
  async setupAdmin(): Promise<any> {
    return this.makeRequest('/admin/setup-admin');
  }

  // Test connection (no auth required)
  async testConnection(): Promise<any> {
    return this.makeRequest('/admin/test');
  }

  // Get admin dashboard stats
  async getAdminStats(): Promise<AdminStats> {
    return this.makeRequest('/admin/stats');
  }

  // Commission Management
  async getCommissions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ commissions: CommissionRecord[]; total: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return this.makeRequest(`/admin/commissions?${queryParams.toString()}`);
  }

  async updateCommissionStatus(commissionId: string, status: 'paid' | 'failed'): Promise<CommissionRecord> {
    return this.makeRequest(`/admin/commissions/${commissionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Apartment Management
  async getAllApartments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ apartments: AdminApartment[]; total: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    return this.makeRequest(`/admin/apartments?${queryParams.toString()}`);
  }

  async updateApartmentStatus(apartmentId: string, status: 'active' | 'inactive' | 'suspended'): Promise<AdminApartment> {
    return this.makeRequest(`/admin/apartments/${apartmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getApartmentDetails(apartmentId: string): Promise<AdminApartment & { bookings: any[] }> {
    return this.makeRequest(`/admin/apartments/${apartmentId}`);
  }

  // Owner Management
  async getAllOwners(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ owners: AdminOwner[]; total: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    return this.makeRequest(`/admin/owners?${queryParams.toString()}`);
  }

  async updateOwnerStatus(ownerId: string, status: 'active' | 'suspended'): Promise<AdminOwner> {
    return this.makeRequest(`/admin/owners/${ownerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getOwnerDetails(ownerId: string): Promise<AdminOwner & { apartments: AdminApartment[]; recentBookings: any[] }> {
    return this.makeRequest(`/admin/owners/${ownerId}`);
  }

  // Reports and Analytics
  async getCommissionReport(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any> {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/admin/reports/commissions?${queryParams.toString()}`);
  }

  async getBookingReport(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any> {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/admin/reports/bookings?${queryParams.toString()}`);
  }

  // Platform Management
  async getPlatformSettings(): Promise<any> {
    return this.makeRequest('/admin/settings');
  }

  async updatePlatformSettings(settings: any): Promise<any> {
    return this.makeRequest('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const adminService = new AdminService();
