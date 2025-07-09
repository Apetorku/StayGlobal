import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  const { getToken } = useAuth();

  // Get notifications
  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.getNotifications(token, 20);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.getUnreadCount(token);
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch
  };
};

export default useNotifications;
