'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { User } from "@/lib/types";
import { collection, query, where, doc } from "firebase/firestore";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LivePage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Redirect to login if user is not anonymous and not loading
  useEffect(() => {
    if (!isUserLoading && authUser && !authUser.isAnonymous) {
      router.replace('/dashboard');
    }
  }, [authUser, isUserLoading, router]);

  const onlineUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for users who are online and are not anonymous
    return query(collection(firestore, 'users'), where('online', '==', true));
  }, [firestore]);

  const { data: onlineUsers, isLoading: usersLoading } = useCollection<User>(onlineUsersQuery);

  const handleStartChat = async (friend: User) => {
    if (!authUser || !firestore) return;

    // Anonymous users can't start chats with other anonymous users
    if (friend.isAnonymous) {
        return;
    }

    const chatId = [authUser.uid, friend.id].sort().join('-');
    const chatRef = doc(firestore, 'chats', chatId);

    await setDocumentNonBlocking(chatRef, {
        id: chatId,
        participantIds: [authUser.uid, friend.id],
    }, { merge: true });

    router.push(`/chat/${friend.id}`);
  };
  
  const registeredOnlineUsers = onlineUsers?.filter(u => u.id !== authUser?.uid && !u.isAnonymous);

  if (usersLoading || isUserLoading) {
      return <div className="container mx-auto py-4 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-4">
       <Card className="mt-4">
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
          <CardDescription>Start a conversation with someone who is currently online.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {registeredOnlineUsers && registeredOnlineUsers.length > 0 ? registeredOnlineUsers.map((user) => (
             <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                 <div>
                  <p className="font-semibold">{user.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleStartChat(user)}>
                 <MessageCircle className="text-primary"/>
              </Button>
            </div>
          )) : (
            <p className="text-muted-foreground text-center">
              No registered users are online right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
