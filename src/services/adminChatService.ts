const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AdminChatMessage {
  _id: string;
  chatId: string;
  senderId: string;
  senderType: 'admin' | 'owner';
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChat {
  _id: string;
  adminId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  adminName: string;
  subject?: string;
  isActive: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  unreadCount: {
    admin: number;
    owner: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatResponse {
  chats: AdminChat[];
  total: number;
}

export interface AvailableOwner {
  clerkId: string;
  name: string;
  email: string;
  joinDate: string;
}

export interface AvailableOwnersResponse {
  owners: AvailableOwner[];
  total: number;
}

export interface AdminChatMessagesResponse {
  messages: AdminChatMessage[];
  hasMore: boolean;
  page: number;
  total: number;
}

class AdminChatService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const fullUrl = `${API_BASE_URL}/admin-chat${endpoint}`;
    console.log('💬 Admin Chat API Request:', fullUrl);
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        console.error('❌ Admin Chat API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin Chat API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Admin Chat Fetch error:', error);
      throw error;
    }
  }

  // Get available house owners for chat
  async getAvailableOwners(): Promise<AvailableOwnersResponse> {
    return this.makeRequest('/available-owners');
  }

  // Get all admin chats
  async getAdminChats(): Promise<AdminChatResponse> {
    return this.makeRequest('/');
  }

  // Get or create chat with a specific owner
  async getOrCreateChat(ownerId: string): Promise<{ message: string; chat: AdminChat }> {
    return this.makeRequest(`/owner/${ownerId}`);
  }

  // Get messages for a specific chat
  async getChatMessages(chatId: string, page: number = 1): Promise<AdminChatMessagesResponse> {
    return this.makeRequest(`/${chatId}/messages?page=${page}`);
  }

  // Send message to a chat
  async sendMessage(chatId: string, message: string): Promise<{ message: string; messageData: AdminChatMessage }> {
    return this.makeRequest(`/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string): Promise<{ message: string }> {
    return this.makeRequest(`/${chatId}/read`, {
      method: 'PATCH',
    });
  }
}

export const adminChatService = new AdminChatService();
export default adminChatService;
