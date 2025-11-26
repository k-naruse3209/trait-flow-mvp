'use client'

import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const notificationStyles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
};

const iconStyles = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
  warning: 'text-yellow-600',
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs sm:max-w-sm w-full px-4 sm:px-0">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type];
        
        return (
          <Card
            key={notification.id}
            className={cn(
              'shadow-lg animate-in slide-in-from-right-full duration-300',
              notificationStyles[notification.type]
            )}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0', iconStyles[notification.type])} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium">{notification.title}</h4>
                  {notification.message && (
                    <p className="text-xs sm:text-sm mt-1 opacity-90">{notification.message}</p>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-black/10 flex-shrink-0"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}