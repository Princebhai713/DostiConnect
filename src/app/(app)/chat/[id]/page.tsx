'use client';

import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Phone, Video, Send, Paperclip, MoreVertical } from 'lucide-react';
import { collection, doc, query, where, Timestamp, orderBy, serverTimestamp } from 'firebase/firestore';
import type { User, Message, Chat } from '@/lib/types';
import { useEffect, useRef, useState, use } from 'react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

export default function ChatConversationPage() {
  const params = useParams();
  const friendId = params.id as string;
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get friend's data
  const friendQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('id', '==', friendId));
  }, [firestore, friendId]);
  const { data: friendData } = useCollection<User>(friendQuery);
  const friend = friendData?.[0];

  // Get chat document
  const chatId = useMemoFirebase(() => {
    if (!authUser) return null;
    return [authUser.uid, friendId].sort().join('-');
  }, [authUser, friendId]);

  // Get messages
  const messagesRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));
  }, [firestore, chatId]);
  const { data: messages } = useCollection<Message>(messagesRef);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !authUser || !firestore || !chatId) return;

    const messageData = {
      senderId: authUser.uid,
      receiverId: friendId,
      content: newMessage,
      timestamp: serverTimestamp(),
    };

    const messagesColRef = collection(firestore, `chats/${chatId}/messages`);
    addDocumentNonBlocking(messagesColRef, messageData);
    setNewMessage('');
  };
  
  if (!friend) {
    // Could show a loading state here
    return null; 
  }


  return (
    <div className="flex flex-col h-full bg-cover bg-center" style={{backgroundImage: "url('/chat-bg.png')"}}>
      <header className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={friend.avatar} alt={friend.username} />
            <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{friend.username}</p>
            {friend.online ? (
                <div className="text-sm opacity-80 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Online
                </div>
            ) : (
                <div className="text-sm opacity-80">Offline</div>
            )}
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
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages?.map((message) => {
            const isCurrentUser = message.senderId === authUser?.uid;
            const timestamp = (message.timestamp as Timestamp)?.toDate();
            
            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
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
                    {timestamp ? format(timestamp, 'p') : 'sending...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <footer className="p-2 bg-transparent border-t-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip />
          </Button>
          <Input 
            placeholder="Type a message..." 
            className="flex-1 rounded-full"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/80">
            <Send />
          </Button>
        </form>
      </footer>
    </div>
  );
}
