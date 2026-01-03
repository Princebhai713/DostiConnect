import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chats, currentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Dot } from 'lucide-react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] h-[calc(100vh-4rem)]">
      <div className="bg-card border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold tracking-tight">Chats</h2>
        </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="flex flex-col">
            {chats.map((chat) => (
              <Link
                key={chat.friend.id}
                href={`/chat/${chat.friend.id}`}
                className={cn(
                  'flex items-center gap-3 p-4 hover:bg-primary/10 transition-colors border-b'
                )}
              >
                <Avatar className="relative h-12 w-12">
                  <AvatarImage src={chat.friend.avatar} alt={chat.friend.name} />
                  <AvatarFallback>{chat.friend.name.charAt(0)}</AvatarFallback>
                  {chat.friend.online && (
                     <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{chat.friend.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.messages.slice(-1)[0]?.sender.id === currentUser.id ? 'You: ' : ''}
                    {chat.messages.slice(-1)[0]?.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="bg-background">
        {children}
      </div>
    </div>
  );
}
