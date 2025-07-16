const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://web-production-8ffb7.up.railway.app/api' : 'https://web-production-8ffb7.up.railway.app/api');

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
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: Failed to sync user`,
          error: 'Network or server error'
        }));

        // Provide user-friendly error messages
        let userMessage = errorData.message || 'Failed to sync user account';

        if (response.status === 404) {
          userMessage = 'User account not found. Please try signing up again.';
        } else if (response.status === 400) {
          userMessage = 'Invalid user data. Please check your account information.';
        } else if (response.status >= 500) {
          userMessage = 'Server error. Please try again in a few moments.';
        }

        throw new Error(userMessage);
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

  async updateUserRole(role: 'guest' | 'owner' | 'admin', token: string): Promise<{ message: string; role: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log('Attempting to update user role to:', role);

      const response = await fetch(`${API_BASE_URL}/users/update-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Role update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: Failed to update user role`,
          error: 'Network or server error'
        }));

        // Provide user-friendly error messages
        let userMessage = errorData.message || 'Failed to update user role';

        if (response.status === 400) {
          userMessage = 'Invalid role specified. Please try again.';
        } else if (response.status === 401) {
          userMessage = 'Authentication required. Please sign in again.';
        } else if (response.status === 404) {
          userMessage = 'User account not found. Please try signing up again.';
        } else if (response.status >= 500) {
          userMessage = 'Server error. Please try again in a few moments.';
        }

        throw new Error(userMessage);
      }

      const result = await response.json();
      console.log('User role updated successfully:', result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Role update error details:', error);
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
