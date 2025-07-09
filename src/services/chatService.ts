const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  senderType: 'owner' | 'renter';
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  bookingId: string;
  apartmentId: string;
  ownerId: string;
  renterId: string;
  renterName: string;
  ownerName: string;
  apartmentTitle: string;
  roomNumber?: number;
  isActive: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  unreadCount: {
    owner: number;
    renter: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  chat: Chat;
  userType: 'owner' | 'renter';
}

export interface MessagesResponse {
  messages: Message[];
  totalPages: number;
  currentPage: number;
}

class ChatService {
  // Get user's chats
  async getUserChats(token: string): Promise<Chat[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chats;
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }

  // Get or create chat for a booking
  async getOrCreateChat(bookingId: string, token: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/booking/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting/creating chat:', error);
      throw error;
    }
  }

  // Get messages for a chat
  async getMessages(chatId: string, token: string, page: number = 1, limit: number = 50): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        messages: data.messages,
        totalPages: data.totalPages,
        currentPage: data.currentPage
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(chatId: string, message: string, token: string): Promise<Message> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get chat by booking ID
  async getChatByBooking(bookingId: string, token: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/by-booking/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting chat by booking:', error);
      throw error;
    }
  }

  // Format message time
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Format last message time for chat list
  formatChatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Get unread count for user
  getUnreadCount(chats: Chat[], userId: string): number {
    return chats.reduce((total, chat) => {
      if (chat.ownerId === userId) {
        return total + chat.unreadCount.owner;
      } else if (chat.renterId === userId) {
        return total + chat.unreadCount.renter;
      }
      return total;
    }, 0);
  }

  // Get other participant name
  getOtherParticipantName(chat: Chat, userId: string): string {
    if (chat.ownerId === userId) {
      return chat.renterName;
    } else {
      return chat.ownerName;
    }
  }

  // Get chat title
  getChatTitle(chat: Chat, userId: string): string {
    const otherParticipant = this.getOtherParticipantName(chat, userId);
    const roomInfo = chat.roomNumber ? ` - Room ${chat.roomNumber}` : '';
    return `${otherParticipant}${roomInfo}`;
  }
}

export const chatService = new ChatService();
export default chatService;
