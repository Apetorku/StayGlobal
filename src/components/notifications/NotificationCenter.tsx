import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { notificationService, Notification } from '@/services/notificationService';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Home,
  AlertTriangle,
  DollarSign,
  MessageCircle
} from 'lucide-react';

const NotificationCenter: React.FC = () => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  // Fetch user notifications only (excluding admin notifications)
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      console.log('🔍 Fetching user notifications...');
      const result = await notificationService.getUserNotifications(token, showAll ? 50 : 10);
      console.log('📬 Fetched notifications:', result.length, result);
      return result;
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: false, // Disable retries
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.getUnreadCount(token);
    },
    refetchInterval: 60000,
    retry: false,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.markAsRead(notificationId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return notificationService.markAllAsRead(token);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast({
        title: "Success",
        description: `Marked ${count} notifications as read`,
      });
    },
  });



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'auto_checkout': return <Home className="h-4 w-4 text-blue-600" />;
      case 'booking_reminder': return <Clock className="h-4 w-4" />;
      case 'checkout_reminder': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'payment_received': return <DollarSign className="h-4 w-4" />;
      case 'system_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'new_message': return <MessageCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string, type?: string) => {
    // Special styling for checkout reminders
    if (type === 'checkout_reminder') {
      return 'border-red-300 bg-red-100 animate-pulse';
    }

    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load notifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-blue-600" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
              }}
            >
              🔄 Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* User Debug Information */}
        <div className="mb-4 p-2 bg-green-100 rounded text-sm">
          <strong>User Notifications Debug:</strong><br/>
          Total user notifications: {notifications.length}<br/>
          Unread count: {unreadCount}<br/>
          Loading: {isLoading ? 'Yes' : 'No'}<br/>
          Error: {error ? 'Yes' : 'No'}<br/>
          Show all: {showAll ? 'Yes' : 'No'}<br/>
          Expected types: auto_checkout, booking_reminder, payment_received, new_message, checkout_reminder, new_booking
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification._id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.isRead
                      ? 'border-gray-200 bg-gray-50'
                      : getPriorityColor(notification.priority, notification.type)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification._id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      {notification.roomNumber && (
                        <Badge variant="outline" className="mt-2">
                          Room {notification.roomNumber}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {notificationService.formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length >= 10 && !showAll && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
            >
              Show More Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
