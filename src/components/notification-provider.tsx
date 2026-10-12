/**
 * Notification Provider
 * Global notification system
 */

'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppStore, Notification } from '@/stores/app-store';
import { cn } from '@/lib/utils';

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export function NotificationProvider(): JSX.Element {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps): JSX.Element {
  const Icon = notificationIcons[notification.type];

  useEffect(() => {
    // Error notifications remain visible indefinitely until user dismisses,
    // unless an explicit positive duration override is provided.
    if (notification.type === 'error' && (notification.duration === undefined || notification.duration <= 0)) {
      return;
    }

    const timeout = notification.duration !== undefined && notification.duration > 0
      ? notification.duration
      : 5000;

    const timer = setTimeout(onRemove, timeout);
    return () => clearTimeout(timer);
  }, [notification.type, notification.duration, onRemove]);

  const colorClasses = {
    success: 'border-success/30 bg-success/10 text-success',
    error: 'border-destructive/30 bg-destructive/10 text-destructive',
    info: 'border-info/30 bg-info/10 text-info',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex gap-3 items-start animate-slide-down pointer-events-auto',
        colorClasses[notification.type]
      )}
      role={notification.type === 'error' ? 'alert' : 'status'}
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
      data-testid={`notification-${notification.id}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {notification.title && <p className="font-semibold">{notification.title}</p>}
        <p className="text-sm">{notification.message}</p>
      </div>
      <button
        onClick={onRemove}
        aria-label="Dismiss notification"
        className="text-current/60 hover:text-current flex-shrink-0 transition-smooth"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * useNotification hook
 */
export function useNotification(): {
  notify: (notification: Omit<Notification, 'id'>) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
} {
  const addNotification = useAppStore((state) => state.addNotification);

  return {
    notify: addNotification,
    success: (message, title, duration = 5000) =>
      addNotification({ type: 'success', message, title, duration }),
    error: (message, title, duration) =>
      addNotification({ type: 'error', message, title, duration }),
    info: (message, title, duration = 5000) =>
      addNotification({ type: 'info', message, title, duration }),
    warning: (message, title, duration = 5000) =>
      addNotification({ type: 'warning', message, title, duration }),
  };
}
