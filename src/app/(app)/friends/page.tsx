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
    const requestsCollectionRef = collection(firestore, `users/${authUser.uid}/friendRequests`);
    return query(requestsCollectionRef, where("status", "==", "pending"));
  }, [firestore, authUser]);
  const { data: allFriendRequests } = useCollection<FriendRequest>(friendRequestsRef);

  const incomingFriendRequests = allFriendRequests?.filter(req => req.receiverId === authUser?.uid);
  const sentFriendRequests = allFriendRequests?.filter(req => req.senderId === authUser?.uid);

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
    
    // Check if a request already exists
    const sentRequestExists = sentFriendRequests?.some(req => req.receiverId === targetUser.id);
    if (sentRequestExists) {
        toast({
            title: "Request Already Sent",
            description: `You have already sent a friend request to ${targetUser.username}.`,
        });
        return;
    }

    const friendRequestData: Omit<FriendRequest, 'id'> = {
      senderId: authUser.uid,
      receiverId: targetUser.id,
      status: 'pending',
      sentDate: serverTimestamp(),
    };
    
    const receiverRequestRef = collection(firestore, `users/${targetUser.id}/friendRequests`);
    const senderRequestRef = collection(firestore, `users/${authUser.uid}/friendRequests`);
    
    // We add the request to both users' subcollections for easy querying
    const docRef = await addDocumentNonBlocking(receiverRequestRef, friendRequestData);
    if (docRef) {
        // use the same ID for the sender's copy
        setDocumentNonBlocking(doc(senderRequestRef, docRef.id), friendRequestData, {});
    }
    
    toast({
        title: "Friend Request Sent",
        description: `Your friend request to ${targetUser.username} has been sent.`,
    });
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!authUser || !firestore || !request.id) return;

    const batch = writeBatch(firestore);

    // Get the original doc from the receiver's side
    const receiverRequestRef = doc(firestore, `users/${request.receiverId}/friendRequests`, request.id);
    batch.update(receiverRequestRef, { status: "accepted" });
    
    // Find and update the corresponding request on the sender's side
    const senderRequestRef = doc(firestore, `users/${request.senderId}/friendRequests`, request.id);
    batch.update(senderRequestRef, { status: "accepted" });

    // Add friend IDs to both users' documents
    const authUserRef = doc(firestore, 'users', authUser.uid);
    const friendUserRef = doc(firestore, 'users', request.senderId);

    const currentUserFriends = friends?.map(f => f.id) || [];
    batch.update(authUserRef, { friendIds: [...currentUserFriends, request.senderId] });
    
    const senderUser = users?.find(u => u.id === request.senderId);
    const senderFriends = senderUser?.friendIds || [];
    batch.update(friendUserRef, { friendIds: [...senderFriends, authUser.uid] });

    await batch.commit();

    toast({
        title: "Friend Request Accepted",
    });
  };
  
  const handleDeclineRequest = async (request: FriendRequest) => {
      if (!authUser || !firestore || !request.id) return;
      
      const batch = writeBatch(firestore);

      const receiverRequestRef = doc(firestore, `users/${request.receiverId}/friendRequests`, request.id);
      batch.delete(receiverRequestRef);

      const senderRequestRef = doc(firestore, `users/${request.senderId}/friendRequests`, request.id);
      batch.delete(senderRequestRef);
      
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
  const sentRequestReceiverIds = (sentFriendRequests?.map(r => r.receiverId) || []);
  const incomingRequestSenderIds = (incomingFriendRequests?.map(r => r.senderId) || []);

  const nonFriendUsers = users?.filter(u => 
      u.id !== authUser?.uid && 
      !friendIds.includes(u.id) && // not already friends
      !sentRequestReceiverIds.includes(u.id) && // haven't sent them a request
      !incomingRequestSenderIds.includes(u.id) // haven't received a request from them
  );
  
  const displayedUsers = searchTerm 
      ? nonFriendUsers?.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
      : nonFriendUsers;


  return (
    <div className="container mx-auto py-4">
      {incomingFriendRequests && incomingFriendRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Requests ({incomingFriendRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomingFriendRequests.map((request) => {
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
            <div className="relative w-full">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input type="text" placeholder="Search by username..." value={searchTerm} onChange={handleSearch} className="pl-8"/>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayedUsers && displayedUsers.length > 0 ? displayedUsers.map((user) => (
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
              <Button size="sm" variant="outline" onClick={() => handleAddFriend(user)}>
                <UserPlus className="mr-2 h-4 w-4"/>
                Add Friend
              </Button>
            </div>
          )) : (
            <p className="text-muted-foreground text-center">
              {searchTerm ? "No users found." : "No new users to add right now."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    