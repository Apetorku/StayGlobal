const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'guest' | 'owner' | 'admin';
  phone?: string;
  avatar?: string;
  preferences: {
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

export interface UpdateProfileData {
  phone?: string;
  preferences?: Partial<User['preferences']>;
}

export const userService = {
  async syncUser(clerkUserId: string): Promise<User> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      console.log('Attempting to sync user:', clerkUserId, 'to', `${API_BASE_URL}/users/sync`);

      const response = await fetch(`${API_BASE_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkUserId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Sync response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to sync user`);
      }

      const userData = await response.json();
      console.log('User synced successfully:', userData);
      return userData;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Sync error details:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - please check if the backend server is running');
      }
      throw error;
    }
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }
    
    return response.json();
  },

  async updateProfile(profileData: UpdateProfileData, token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }
    
    return response.json();
  },
};
