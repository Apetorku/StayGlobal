import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  showIcon?: boolean;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  showIcon = false, 
  className = "" 
}) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0 && !showIcon) {
    return null;
  }

  if (showIcon) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-blue-600" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Badge variant="destructive" className={`text-xs ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
};

export default NotificationBadge;
