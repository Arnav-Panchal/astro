"use client";
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import NotificationBell from '@/components/NotificationBell';
import { getAstrologerNotificationCount } from '@/lib/store';
import { useCallback } from 'react';

const AstrologerHeader = () => {
  // Memoize the function passed to NotificationBell
  const memoizedGetAstrologerNotificationCount = useCallback(() => {
    return getAstrologerNotificationCount();
  }, []);


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/astrologer" passHref aria-label="Go to Astrologer Dashboard">
          <AppLogo />
        </Link>
        <div className="flex items-center space-x-4">
          <NotificationBell 
            getNotificationCount={memoizedGetAstrologerNotificationCount} 
            notificationSourceKey="astrologer" 
          />
        </div>
      </div>
    </header>
  );
};

export default AstrologerHeader;
