import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { currentUser } from '@/lib/data';
import { MoreVertical, Search, Camera } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
              <TabsTrigger value="friends" asChild className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none data-[state=active]:shadow-none">
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
