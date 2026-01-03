import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { chats, currentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Phone, Video, Send, Paperclip, Dot } from 'lucide-react';

export default function ChatConversationPage({ params }: { params: { id: string } }) {
  const chat = chats.find(c => c.friend.id === params.id);

  if (!chat) {
    notFound();
  }

  const { friend, messages } = chat;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Avatar className="relative h-12 w-12">
            <AvatarImage src={friend.avatar} alt={friend.name} />
            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{friend.name}</p>
            {friend.online && <div className="text-sm text-green-500 flex items-center"><Dot className="-ml-1" />Online</div>}
            {!friend.online && <div className="text-sm text-muted-foreground">Offline</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => {
            const isCurrentUser = message.sender.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm shadow-md',
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card text-card-foreground rounded-bl-none'
                  )}
                >
                  <p>{message.content}</p>
                   <p className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                    {message.timestamp}
                  </p>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <footer className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip />
          </Button>
          <Input placeholder="Type a message..." className="flex-1" />
          <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/80">
            <Send />
          </Button>
        </div>
      </footer>
    </div>
  );
}
