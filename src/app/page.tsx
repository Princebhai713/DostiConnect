'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // If user is logged in (including anonymous), redirect to dashboard
        router.replace('/dashboard');
      } else {
        // If no user is logged in at all, redirect to login.
        // The guest/anonymous flow starts from the login page.
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  // You can render a loading spinner here while the redirect is happening
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
