import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chats, currentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatListLayout({ children }: { children: React.ReactNode }) {
  const showChatList = children.type.name === 'ChatPage';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] h-[calc(100vh-106px)] relative">
      <div className={cn("bg-background border-r flex flex-col", !showChatList && "hidden md:flex")}>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {chats.map((chat) => (
              <Link
                key={chat.friend.id}
                href={`/chat/${chat.friend.id}`}
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b'
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.friend.avatar} alt={chat.friend.name} />
                  <AvatarFallback>{chat.friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.friend.name}</p>
                    <p className="text-xs text-muted-foreground">{chat.messages.slice(-1)[0]?.timestamp}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.messages.slice(-1)[0]?.sender.id === currentUser.id ? 'You: ' : ''}
                    {chat.messages.slice(-1)[0]?.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
        <Button className="absolute bottom-4 right-4 rounded-full h-14 w-14 shadow-lg">
           <MessageSquarePlus className="h-6 w-6" />
        </Button>
      </div>
      <div className={cn("bg-background", !showChatList && "hidden md:block")}>
        {children}
      </div>
      
      {/* On mobile, only show the conversation */}
      <div className={cn("bg-background md:hidden", showChatList && "hidden")}>
        {children}
      </div>
    </div>
  );
}
