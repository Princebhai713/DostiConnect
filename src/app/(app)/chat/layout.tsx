'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Chat, User, Message } from '@/lib/types';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';


export default function ChatListLayout({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [chats, setChats] = useState<(Chat & { friend: User, lastMessage?: Message })[]>([]);

  // 1. Fetch user's chats
  const chatsRef = useMemoFirebase(() => {
    if (!authUser) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', authUser.uid));
  }, [firestore, authUser]);

  const { data: userChats, isLoading: chatsLoading } = useCollection<Chat>(chatsRef);

  // 2. Fetch user data for all participants & listen to last message
  useEffect(() => {
    if (!userChats || !firestore || !authUser) return;

    const processChats = async () => {
      const populatedChats: (Chat & { friend: User, lastMessage?: Message })[] = [];

      for (const chat of userChats) {
        const friendId = chat.participantIds.find(id => id !== authUser.uid);
        if (friendId) {
          const userDocRef = doc(firestore, 'users', friendId);
          const userSnap = await getDocs(query(collection(firestore, 'users'), where('id', '==', friendId)));
          
          if (!userSnap.empty) {
            const friendData = userSnap.docs[0].data() as User;
            
            // Get last message
             const messagesRef = collection(firestore, `chats/${chat.id}/messages`);
             const q = query(messagesRef, where("timestamp", "!=", null));
             
             // This part is not fully real-time yet. For full real-time, you'd need to manage multiple listeners.
             const lastMessageSnap = await getDocs(q);
             const lastMessage = lastMessageSnap.docs?.[0]?.data() as Message | undefined;

            populatedChats.push({ ...chat, friend: friendData, lastMessage });
          }
        }
      }
      setChats(populatedChats);
    };

    processChats();

  }, [userChats, firestore, authUser]);


  const showChatList = children.type.name === 'ChatPage';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] h-[calc(100vh-106px)] relative">
      <div className={cn("bg-background border-r flex flex-col", !showChatList && "hidden md:flex")}>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.friend.id}`}
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b'
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.friend.avatar} alt={chat.friend.username} />
                    <AvatarFallback>{chat.friend.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {chat.friend.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.friend.username}</p>
                     {chat.lastMessage?.timestamp && (
                       <p className="text-xs text-muted-foreground">
                         {formatDistanceToNow(new Date((chat.lastMessage.timestamp as any).seconds * 1000), { addSuffix: true })}
                       </p>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage?.senderId === authUser?.uid ? 'You: ' : ''}
                    {chat.lastMessage?.content}
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
