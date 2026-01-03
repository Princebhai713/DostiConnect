'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { User, FriendRequest, Chat } from "@/lib/types";
import { collection, query, where, doc, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { MessageCircle, Search, UserCheck, UserX, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FriendsPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users } = useCollection<User>(usersRef);

  const friendRequestsRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return query(collection(firestore, `users/${authUser.uid}/friendRequests`), where("status", "==", "pending"), where("receiverId", "==", authUser.uid));
  }, [firestore, authUser]);
  const { data: friendRequests } = useCollection<FriendRequest>(friendRequestsRef);
  
  const friendsQuery = useMemoFirebase(() => {
     if (!authUser || !firestore) return null;
    return query(collection(firestore, 'users'), where('friendIds', 'array-contains', authUser.uid)); 
  }, [firestore, authUser]);
  const { data: friends } = useCollection<User>(friendsQuery);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleAddFriend = async (targetUser: User) => {
    if (!authUser || !firestore) return;
    
    const friendRequest: Omit<FriendRequest, 'id' | 'sentDate'> = {
      senderId: authUser.uid,
      receiverId: targetUser.id,
      status: 'pending',
    };
    
    const receiverRequestRef = collection(firestore, `users/${targetUser.id}/friendRequests`);
    addDocumentNonBlocking(receiverRequestRef, {...friendRequest, sentDate: serverTimestamp()});

    const senderRequestRef = collection(firestore, `users/${authUser.uid}/friendRequests`);
    addDocumentNonBlocking(senderRequestRef, {...friendRequest, sentDate: serverTimestamp()});
    
    toast({
        title: "Friend Request Sent",
        description: `Your friend request to ${targetUser.username} has been sent.`,
    });
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!authUser || !firestore) return;

    const batch = writeBatch(firestore);

    // Update the request status in receiver's collection
    const receiverRequestRef = doc(firestore, `users/${request.receiverId}/friendRequests`, request.id);
    batch.update(receiverRequestRef, { status: "accepted" });
    
    // Update the request status in sender's collection
    const senderRequestsQuery = query(
        collection(firestore, `users/${request.senderId}/friendRequests`), 
        where("senderId", "==", request.senderId), 
        where("receiverId", "==", request.receiverId)
    );
    const senderRequestsSnapshot = await getDocs(senderRequestsQuery);
    senderRequestsSnapshot.forEach(doc => {
       batch.update(doc.ref, { status: "accepted" });
    });

    // Add friend IDs to both users' documents
    const authUserRef = doc(firestore, 'users', authUser.uid);
    const friendUserRef = doc(firestore, 'users', request.senderId);

    batch.update(authUserRef, { friendIds: [...(friends?.map(f => f.id) || []), request.senderId] });
    
    const senderUser = users?.find(u => u.id === request.senderId);
    batch.update(friendUserRef, { friendIds: [...(senderUser?.friendIds || []), authUser.uid] });


    await batch.commit();

    toast({
        title: "Friend Request Accepted",
    });
  };
  
  const handleDeclineRequest = async (request: FriendRequest) => {
      if (!authUser || !firestore) return;
      
      const batch = writeBatch(firestore);

      const receiverRequestRef = doc(firestore, `users/${request.receiverId}/friendRequests`, request.id);
      batch.delete(receiverRequestRef);

      const senderRequestsQuery = query(collection(firestore, `users/${request.senderId}/friendRequests`), where("senderId", "==", request.senderId), where("receiverId", "==", request.receiverId));
      const senderRequestsSnapshot = await getDocs(senderRequestsQuery);
      senderRequestsSnapshot.forEach(doc => {
         batch.delete(doc.ref);
      });
      
      await batch.commit();

      toast({
          title: "Friend Request Declined",
          variant: "destructive",
      });
  };

  const handleStartChat = async (friend: User) => {
    if (!authUser || !firestore) return;

    const chatId = [authUser.uid, friend.id].sort().join('-');
    const chatRef = doc(firestore, 'chats', chatId);

    // Create chat doc if it doesn't exist
    await setDocumentNonBlocking(chatRef, {
        id: chatId,
        participantIds: [authUser.uid, friend.id],
        lastMessage: null,
    }, { merge: true });

    router.push(`/chat/${friend.id}`);
  };

  const getSender = (senderId: string) => users?.find(u => u.id === senderId);

  const friendIds = friends?.map(f => f.id) || [];
  const sentRequestReceiverIds = (friendRequests?.map(r => r.receiverId) || []);

  const nonFriendUsers = users?.filter(u => 
      u.id !== authUser?.uid && 
      !friendIds.includes(u.id) &&
      !sentRequestReceiverIds.includes(u.id)
  );
  
  const searchResults = searchTerm 
      ? nonFriendUsers?.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];


  return (
    <div className="container mx-auto py-4">
      {friendRequests && friendRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Requests ({friendRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {friendRequests.map((request) => {
              const sender = getSender(request.senderId);
              if (!sender) return null;
              return (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={sender.avatar} alt={sender.username} />
                    <AvatarFallback>{sender.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{sender.username}</p>
                    <p className="text-sm text-muted-foreground">@{sender.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-accent hover:bg-accent/80 text-accent-foreground" onClick={() => handleAcceptRequest(request)}>
                    <UserCheck className="mr-2 h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeclineRequest(request)}>
                    <UserX className="mr-2 h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            )})}
          </CardContent>
        </Card>
      )}
      
      {friends && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Your Friends ({friends.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={friend.avatar} alt={friend.username} />
                    <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">@{friend.id}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleStartChat(friend)}>
                    <MessageCircle className="text-primary"/>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Find New Friends</CardTitle>
          <div className="flex w-full items-center space-x-2 pt-2">
            <Input type="text" placeholder="Enter a username" value={searchTerm} onChange={handleSearch} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchResults?.map((user) => (
             <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                 <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">@{user.id}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleAddFriend(user)}>
                <UserPlus className="mr-2 h-4 w-4"/>
                Add Friend
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
