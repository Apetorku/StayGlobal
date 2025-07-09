const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Apartment {
  _id: string;
  title: string;
  description: string;
  location: {
    country: string;
    region: string;
    town: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  price: number;
  totalRooms: number;
  availableRooms: number;
  images: string[];
  amenities: string[];
  rating: number;
  reviews: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApartmentFilters {
  country?: string;
  region?: string;
  town?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  amenities?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateApartmentData {
  title: string;
  description: string;
  location: {
    country: string;
    region: string;
    town: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  price: number;
  totalRooms: number;
  availableRooms: number;
  images: string[];
  amenities: string[];
}

export interface ApartmentResponse {
  apartments: Apartment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const apartmentService = {
  async getApartments(filters: ApartmentFilters = {}): Promise<ApartmentResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/apartments?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch apartments: ${response.statusText}`);
    }

    return response.json();
  },

  async getApartmentById(id: string): Promise<Apartment> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch apartment: ${response.statusText}`);
    }
    
    return response.json();
  },

  async createApartment(apartmentData: CreateApartmentData, token: string): Promise<Apartment> {
    console.log('🌐 Making API request to:', `${API_BASE_URL}/apartments`);
    console.log('📦 Request payload:', apartmentData);

    const response = await fetch(`${API_BASE_URL}/apartments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(apartmentData),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to create apartment`);
    }

    const result = await response.json();
    console.log('✅ API Success:', result);
    return result;
  },

  async updateApartment(id: string, apartmentData: Partial<Apartment>, token: string): Promise<Apartment> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(apartmentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update apartment');
    }
    
    return response.json();
  },

  async deleteApartment(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete apartment');
    }
  },

  async getMyApartments(token: string, page = 1, limit = 10): Promise<ApartmentResponse> {
    const response = await fetch(`${API_BASE_URL}/apartments/my/listings?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch your apartments');
    }

    return response.json();
  },

  async getOwnerApartments(token: string): Promise<ApartmentResponse> {
    return this.getMyApartments(token);
  },
};
