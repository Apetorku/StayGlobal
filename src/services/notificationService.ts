const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Notification {
  _id: string;
  userId: string;
  type: 'auto_checkout' | 'booking_reminder' | 'payment_received' | 'system_alert' | 'new_message' | 'checkout_reminder';
  title: string;
  message: string;
  bookingId?: string;
  apartmentId?: string;
  guestName?: string;
  roomNumber?: number;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  readAt?: string;
}

export interface UpcomingCheckout {
  _id: string;
  guestName: string;
  roomNumber: number;
  checkOut: string;
  apartmentId: {
    title: string;
    ownerId: string;
  };
}

class NotificationService {
  // Get notifications for current user
  async getNotifications(token: string, limit: number = 20): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
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
      return data.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(token: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
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
      return data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, token: string): Promise<Notification> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(token: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.markedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get upcoming checkouts
  async getUpcomingCheckouts(token: string, hours: number = 24): Promise<UpcomingCheckout[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/upcoming-checkouts?hours=${hours}`, {
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
      return data.checkouts;
    } catch (error) {
      console.error('Error fetching upcoming checkouts:', error);
      throw error;
    }
  }

  // Trigger manual auto checkout (for testing)
  async triggerAutoCheckout(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/trigger-auto-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error triggering auto checkout:', error);
      throw error;
    }
  }

  // Format notification time
  formatNotificationTime(dateString: string): string {
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

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'auto_checkout': return '🏠';
      case 'booking_reminder': return '⏰';
      case 'checkout_reminder': return '🚨';
      case 'payment_received': return '💰';
      case 'system_alert': return '⚠️';
      case 'new_message': return '💬';
      default: return '📢';
    }
  }

  // Get priority color
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
