import Notification, { INotification } from '../models/Notification';
import Apartment from '../models/Apartment';
import { IBooking } from '../models/Booking';

export class NotificationService {
  // Create a notification for auto check-out
  static async createAutoCheckoutNotification(booking: IBooking): Promise<INotification> {
    try {
      // Get apartment details to find the owner
      const apartment = await Apartment.findById(booking.apartmentId);
      if (!apartment) {
        throw new Error('Apartment not found');
      }

      const notification = new Notification({
        userId: apartment.ownerId,
        type: 'auto_checkout',
        title: 'Guest Auto Check-Out',
        message: `${booking.guestName} has been automatically checked out from Room ${booking.roomNumber}. Booking period ended.`,
        bookingId: booking._id,
        apartmentId: booking.apartmentId,
        guestName: booking.guestName,
        roomNumber: booking.roomNumber,
        priority: 'medium'
      });

      await notification.save();
      console.log(`✅ Auto checkout notification created for owner ${apartment.ownerId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating auto checkout notification:', error);
      throw error;
    }
  }

  // Create a general notification
  static async createNotification(data: {
    userId: string;
    type: 'auto_checkout' | 'booking_reminder' | 'payment_received' | 'system_alert' | 'new_message' | 'checkout_reminder';
    title: string;
    message: string;
    bookingId?: string;
    apartmentId?: string;
    guestName?: string;
    roomNumber?: number;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<INotification> {
    try {
      const notification = new Notification(data);
      await notification.save();
      console.log(`✅ Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for new message
  static async createMessageNotification(
    recipientId: string,
    senderName: string,
    messageContent: string,
    apartmentTitle: string,
    roomNumber?: number,
    chatId?: string
  ): Promise<INotification> {
    try {
      const messagePreview = messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent;

      const notification = new Notification({
        userId: recipientId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        message: `"${messagePreview}"${roomNumber ? ` - Room ${roomNumber}` : ''}`,
        priority: 'medium',
        isRead: false
      });

      await notification.save();
      console.log(`✅ Message notification created for user ${recipientId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating message notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limit: number = 20): Promise<INotification[]> {
    try {
      console.log(`📬 Fetching notifications for user: ${userId}, limit: ${limit}`);

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate({
          path: 'bookingId',
          select: 'ticketCode guestName',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'apartmentId',
          select: 'title location',
          options: { strictPopulate: false }
        });

      console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);
      return notifications;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (notification) {
        console.log(`✅ Notification ${notificationId} marked as read`);
      }
      return notification;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);
      return result.modifiedCount;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await Notification.countDocuments({ userId, isRead: false });
      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  // Delete old notifications (cleanup)
  static async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      return 0;
    }
  }
}

export default NotificationService;
