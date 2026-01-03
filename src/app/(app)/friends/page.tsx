import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { friends, friendRequests, users } from "@/lib/data";
import { MessageCircle, Search, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

export default function FriendsPage() {
  const nonFriendUsers = users.filter(u => !friends.some(f => f.id === u.id) && !friendRequests.some(fr => fr.user.id === u.id));

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Manage Your Connections</h1>
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests</TabsTrigger>
          <TabsTrigger value="find">Find Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={friend.avatar} alt={friend.name} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
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
        </TabsContent>
        
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests ({friendRequests.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={request.user.avatar} alt={request.user.name} />
                      <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div>
                      <p className="font-semibold">{request.user.name}</p>
                      <p className="text-sm text-muted-foreground">@{request.user.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-accent hover:bg-accent/80 text-accent-foreground">
                      <UserCheck className="mr-2 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="destructive">
                      <UserX className="mr-2 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="find">
          <Card>
            <CardHeader>
              <CardTitle>Add New Friends</CardTitle>
              <div className="flex w-full items-center space-x-2 pt-2">
                <Input type="text" placeholder="Enter a User ID (e.g., user-5)" />
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Or connect with someone new:</p>
              {nonFriendUsers.map((user) => (
                 <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.id}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Add Friend
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
