'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { MoreVertical, Search, Camera, LogOut } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is checked and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
    // If the user is anonymous, they should be on the /live page, not in the main app layout.
    // The main app layout is for registered users.
    if (!isUserLoading && user?.isAnonymous) {
      router.replace('/live');
    }
  }, [user, isUserLoading, router]);


  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };
  
  if (isUserLoading || !user || user.isAnonymous) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // This layout is now only for registered users.
  // The anonymous/guest view is handled by redirecting to /live.
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground shadow-md z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">DostiConnect</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Camera />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Search />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={handleLogout}>
                <LogOut />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <MoreVertical />
              </Button>
            </div>
          </div>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary text-primary-foreground/80 p-0">
              <TabsTrigger value="chat" asChild className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none data-[state=active]:shadow-none">
                <Link href="/chat">CHATS</Link>
              </TabsTrigger>
              <TabsTrigger value="friends" asChild className="data_state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none data-[state=active]:shadow-none">
                <Link href="/friends">FRIENDS</Link>
              </TabsTrigger>
              <TabsTrigger value="settings" asChild className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none data-[state=active]:shadow-none">
                 <Link href="/settings">SETTINGS</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>
      <main className="flex-1 bg-muted/20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
