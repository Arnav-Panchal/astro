"use client";
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import NotificationBell from '@/components/NotificationBell';
import { getUserNotificationCount } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const UserHeader = () => {
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');

  // Memoize the function passed to NotificationBell
  const getScopedUserNotificationCount = useCallback(() => {
    return questionId ? getUserNotificationCount(questionId) : 0;
  }, [questionId]);

  const notificationSourceKey = questionId ? `user-${questionId}` : 'user-generic';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" passHref aria-label="Go to Homepage">
          <AppLogo />
        </Link>
        <div className="flex items-center space-x-4">
          {questionId && (
            <NotificationBell 
              getNotificationCount={getScopedUserNotificationCount}
              notificationSourceKey={notificationSourceKey}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
