'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { User, FriendRequest } from "@/lib/types";
import { collection, query, where, doc, getDocs, writeBatch } from "firebase/firestore";
import { MessageCircle, Search, UserCheck, UserX, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FriendsPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users } = useCollection<User>(usersRef);

  const friendRequestsRef = useMemoFirebase(() => {
    if (!authUser) return null;
    return query(collection(firestore, `users/${authUser.uid}/friendRequests`), where("status", "==", "pending"));
  }, [firestore, authUser]);
  const { data: friendRequests } = useCollection<FriendRequest>(friendRequestsRef);
  
  const friendsRef = useMemoFirebase(() => {
     if (!authUser) return null;
    return query(collection(firestore, 'users'), where('id', '!=', authUser.uid)); // Mock for now
  }, [firestore, authUser]);
  const { data: allUsers } = useCollection<User>(friendsRef);

  const friends = allUsers; // This needs a proper friend list implementation

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleAddFriend = async (targetUser: User) => {
    if (!authUser || !firestore) return;
    
    const friendRequest: Omit<FriendRequest, 'id'> = {
      senderId: authUser.uid,
      receiverId: targetUser.id,
      status: 'pending',
      sentDate: new Date(),
    };
    
    // Add request to receiver's subcollection
    const receiverRequestRef = collection(firestore, `users/${targetUser.id}/friendRequests`);
    addDocumentNonBlocking(receiverRequestRef, friendRequest);

    // Add request to sender's subcollection for tracking
    const senderRequestRef = collection(firestore, `users/${authUser.uid}/friendRequests`);
    addDocumentNonBlocking(senderRequestRef, friendRequest);
    
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
    
    // Update the request status in sender's collection (find it first)
    const senderRequestsQuery = query(collection(firestore, `users/${request.senderId}/friendRequests`), where("senderId", "==", request.senderId), where("receiverId", "==", request.receiverId));
    const senderRequestsSnapshot = await getDocs(senderRequestsQuery);
    senderRequestsSnapshot.forEach(doc => {
       batch.update(doc.ref, { status: "accepted" });
    });

    // In a real app, you would also add to a 'friends' subcollection for both users.
    // For now we'll just update the status.

    await batch.commit();

    toast({
        title: "Friend Request Accepted",
    });
  };
  
  const handleDeclineRequest = async (request: FriendRequest) => {
      if (!authUser || !firestore) return;
      
      const batch = writeBatch(firestore);

      // Delete request from receiver's collection
      const receiverRequestRef = doc(firestore, `users/${request.receiverId}/friendRequests`, request.id);
      batch.delete(receiverRequestRef);

      // Delete request from sender's collection
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

  const getSender = (senderId: string) => users?.find(u => u.id === senderId);


  // Very basic friend filtering for now
  const nonFriendUsers = users?.filter(u => u.id !== authUser?.uid /* Add more complex friend logic here */ );
  
  const searchResults = nonFriendUsers?.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));


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
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/chat/${friend.id}`}>
                    <MessageCircle className="text-primary"/>
                  </Link>
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
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
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
