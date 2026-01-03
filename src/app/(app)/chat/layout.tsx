'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Chat, User, Message } from '@/lib/types';
import { collection, query, where, getDocs, doc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';


export default function ChatListLayout({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [chats, setChats] = useState<(Chat & { friend: User, lastMessage?: Message })[]>([]);

  // 1. Fetch user's chats
  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', authUser.uid));
  }, [firestore, authUser]);

  const { data: userChats, isLoading: chatsLoading } = useCollection<Chat>(chatsQuery);

  // 2. Fetch user data for all participants & listen to last message
  useEffect(() => {
    if (!userChats || !firestore || !authUser) return;

    const unsubscribers: (() => void)[] = [];

    const processChats = async () => {
      const populatedChats = await Promise.all(userChats.map(async (chat) => {
        const friendId = chat.participantIds.find(id => id !== authUser.uid);
        if (!friendId) return null;

        const userSnap = await getDocs(query(collection(firestore, 'users'), where('id', '==', friendId)));
        if (userSnap.empty) return null;

        const friendData = userSnap.docs[0].data() as User;
        
        return new Promise<{ chat: Chat; friend: User }>((resolve) => {
          const messagesRef = collection(firestore, `chats/${chat.id}/messages`);
          const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

          const unsubscribe = onSnapshot(q, (snapshot) => {
             const lastMessage = snapshot.docs[0]?.data() as Message | undefined;
             
             setChats(prevChats => {
                const existingChatIndex = prevChats.findIndex(c => c.id === chat.id);
                const newChatData = { ...chat, friend: friendData, lastMessage };
                
                if (existingChatIndex > -1) {
                    const updatedChats = [...prevChats];
                    updatedChats[existingChatIndex] = newChatData;
                    return updatedChats;
                } else {
                    return [...prevChats, newChatData];
                }
             });
          });
          unsubscribers.push(unsubscribe);
          // We don't need to resolve anything here as state is updated in the listener
        });
      }));

      // Filter out nulls if any chat processing failed
      const validPopulatedChats = populatedChats.filter(Boolean);
    };

    processChats();
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
    }

  }, [userChats, firestore, authUser]);


  const showChatList = children.type.name === 'ChatPage';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] h-[calc(100vh-106px)] relative">
      <div className={cn("bg-background border-r flex flex-col", !showChatList && "hidden md:flex")}>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {chats
              .sort((a, b) => {
                  const timeA = (a.lastMessage?.timestamp as any)?.seconds || 0;
                  const timeB = (b.lastMessage?.timestamp as any)?.seconds || 0;
                  return timeB - timeA;
              })
              .map((chat) => (
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
