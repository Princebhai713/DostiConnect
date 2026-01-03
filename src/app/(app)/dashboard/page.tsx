import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser, friendSuggestions } from "@/lib/data";
import type { User } from "@/lib/types";
import { UserPlus } from "lucide-react";

// In a real application, you would call the suggestFriends AI flow.
// import { suggestFriends } from "@/ai/flows/friend-suggestions";
// const suggestions = await suggestFriends({ userProfile: '...', userActivity: '...' });

export default function DashboardPage() {
  const suggestions: User[] = friendSuggestions;

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here are some people you might want to connect with.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Friend Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suggestions.map((user) => (
              <Card key={user.id} className="flex flex-col items-center justify-center p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground mb-4">@{user.id}</p>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/80">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
