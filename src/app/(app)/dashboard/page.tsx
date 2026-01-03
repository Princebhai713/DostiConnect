'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { User } from "@/lib/types";
import { collection, query, where, doc } from "firebase/firestore";
import { MessageCircle, Users, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const onlineUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('online', '==', true));
  }, [firestore]);

  const { data: onlineUsers, isLoading: usersLoading } = useCollection<User>(onlineUsersQuery);

  const friendsQuery = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return query(collection(firestore, 'users'), where('friendIds', 'array-contains', authUser.uid));
  }, [firestore, authUser]);
  const { data: friends } = useCollection<User>(friendsQuery);

  const handleStartChat = async (friend: User) => {
    if (!authUser || !firestore) return;

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
      return <div className="container mx-auto p-4 md:p-6 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <CardDescription>Here's a quick overview of your DostiConnect world.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/friends">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Your Friends</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{friends?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total friends connected</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/friends">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Find Friends</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground pt-2">Discover and connect with new people on the platform.</p>
              </CardContent>
            </Card>
          </Link>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Live Mode: Online Users</CardTitle>
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
            <p className="text-muted-foreground text-center py-8">
              No other users are online right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
