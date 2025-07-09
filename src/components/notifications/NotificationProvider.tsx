import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { notificationService, Notification } from '@/services/notificationService';
import { NotificationSound } from '@/utils/notificationSound';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastNotificationCount = useRef<number>(0);
  const processedNotifications = useRef<Set<string>>(new Set());

  // Poll for new notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.getNotifications(token, 10);
    },
    refetchInterval: 30000, // Check every 30 seconds (reduced frequency)
    enabled: !!userId,
    retry: (failureCount, error) => {
      // Don't retry on 500 errors to avoid spam
      if (error.message.includes('500')) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      console.warn('⚠️ Notification polling failed:', error.message);
    },
  });

  // Check for new notifications and show toasts
  useEffect(() => {
    if (!notifications.length) return;

    // Find new unread notifications
    const newNotifications = notifications.filter((notification: Notification) => 
      !notification.isRead && 
      !processedNotifications.current.has(notification._id) &&
      // Only show notifications from the last 5 minutes to avoid spam on page load
      new Date(notification.createdAt).getTime() > Date.now() - (5 * 60 * 1000)
    );

    newNotifications.forEach((notification: Notification) => {
      // Mark as processed to avoid duplicate toasts
      processedNotifications.current.add(notification._id);

      // Show toast notification
      const icon = notificationService.getNotificationIcon(notification.type);

      toast({
        title: `${icon} ${notification.title}`,
        description: notification.message,
        duration: notification.type === 'checkout_reminder' ? 8000 :
                 notification.type === 'new_message' ? 6000 : 4000, // Longer duration for checkout reminders
        variant: notification.type === 'checkout_reminder' ? 'destructive' : 'default',
      });

      // Play notification sound
      if (notification.type === 'checkout_reminder') {
        // Play urgent sound for checkout reminders
        NotificationSound.playNotificationSound();
        // Play again after 1 second for urgency
        setTimeout(() => NotificationSound.playNotificationSound(), 1000);
      } else if (notification.type === 'new_message') {
        NotificationSound.playMessageSound();
      } else {
        NotificationSound.playNotificationSound();
      }

      // Auto-refresh chat queries if it's a message notification
      if (notification.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['user-chats'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      }
    });

    lastNotificationCount.current = notifications.length;
  }, [notifications, toast, queryClient]);

  // Clean up processed notifications periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Keep only the last 100 processed notification IDs
      const processedArray = Array.from(processedNotifications.current);
      if (processedArray.length > 100) {
        processedNotifications.current = new Set(processedArray.slice(-50));
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
