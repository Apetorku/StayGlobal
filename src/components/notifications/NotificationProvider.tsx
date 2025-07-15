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

  // Disable notifications temporarily if causing issues
  const NOTIFICATIONS_ENABLED = true; // Set to false to disable

  // Poll for new user notifications only
  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.getUserNotifications(token, 10);
    },
    refetchInterval: 60000, // Check every 60 seconds (reduced frequency)
    enabled: !!userId && NOTIFICATIONS_ENABLED,
    retry: false, // Disable retries to prevent spam
    onError: (error) => {
      // Silently handle errors to prevent console spam
      if (!error.message.includes('500')) {
        console.warn('⚠️ Notification polling failed:', error.message);
      }
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

    // Only show the most recent notification to avoid spam
    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0];

      // Mark as processed
      processedNotifications.current.add(latestNotification._id);

      // Show simple toast
      toast({
        title: latestNotification.title,
        description: latestNotification.message,
        duration: 4000,
        variant: latestNotification.priority === 'high' ? 'destructive' : 'default',
      });

      // Play single notification sound
      try {
        NotificationSound.playNotificationSound();
      } catch (error) {
        // Silently handle sound errors
      }

      console.log('🔔 New notification:', latestNotification.title);
    }

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
