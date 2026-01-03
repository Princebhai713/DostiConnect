import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chats, currentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Phone, Video, Send, Paperclip, MoreVertical } from 'lucide-react';

export default function ChatConversationPage({ params }: { params: { id: string } }) {
  const chat = chats.find(c => c.friend.id === params.id);

  if (!chat) {
    notFound();
  }

  const { friend, messages } = chat;

  return (
    <div className="flex flex-col h-full bg-cover bg-center" style={{backgroundImage: "url('/chat-bg.png')"}}>
      <header className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={friend.avatar} alt={friend.name} />
            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{friend.name}</p>
            {friend.online && <div className="text-sm opacity-80">Online</div>}
            {!friend.online && <div className="text-sm opacity-80">Offline</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.sender.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 text-sm shadow-md',
                    isCurrentUser
                      ? 'bg-[#dcf8c6] text-black'
                      : 'bg-white text-black'
                  )}
                >
                  <p>{message.content}</p>
                   <p className={cn("text-xs mt-1 text-right", isCurrentUser ? "text-black/50" : "text-black/50")}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <footer className="p-2 bg-transparent border-t-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip />
          </Button>
          <Input placeholder="Type a message..." className="flex-1 rounded-full" />
          <Button size="icon" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/80">
            <Send />
          </Button>
        </div>
      </footer>
    </div>
  );
}
