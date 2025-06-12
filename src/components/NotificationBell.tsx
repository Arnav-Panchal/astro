"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface NotificationBellProps {
  getNotificationCount: () => number;
  notificationSourceKey: string; // A unique key to identify the source for event listening
}

const NotificationBell: React.FC<NotificationBellProps> = ({ getNotificationCount, notificationSourceKey }) => {
  const [count, setCount] = useState(0);

  const updateCount = useCallback(() => {
    setCount(getNotificationCount());
  }, [getNotificationCount]);

  useEffect(() => {
    updateCount(); // Initial count

    const eventName = `notificationsUpdated:${notificationSourceKey}`;
    
    window.addEventListener(eventName, updateCount);
    // Fallback for general storage changes if specific events are missed.
    // Note: 'storage' event only fires for changes in other tabs/windows.
    window.addEventListener('storage', updateCount);


    return () => {
      window.removeEventListener(eventName, updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [updateCount, notificationSourceKey]);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-accent hover:bg-accent/10 focus-visible:ring-accent">
          <Bell className="h-6 w-6" />
          {count > 0 && (
            <Badge
              variant="default" 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] p-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground animate-subtle-pulse shadow-md"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 shadow-xl rounded-lg border-border">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium font-headline leading-none text-foreground">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              {count > 0 ? `You have ${count} new notification(s).` : "No new notifications."}
            </p>
          </div>
          {/* Implement a list of actual notifications here if needed */}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper to dispatch notification update events
export const dispatchNotificationUpdate = (sourceKey: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`notificationsUpdated:${sourceKey}`));
  }
};


export default NotificationBell;
