'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Camera, LogOut, KeyRound, Bell } from 'lucide-react';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } = useDoc<User>(userDocRef);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };
  
  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="container mx-auto py-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-7 w-7">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-muted-foreground">@{user?.id}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingsItem icon={KeyRound} title="Account" description="Privacy, security, change number" />
          <SettingsItem icon={Bell} title="Notifications" description="Messages, group & call tones" />
          <div onClick={handleLogout}>
            <SettingsItem icon={LogOut} title="Log Out" description="Log out from your account" />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={user?.username} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue={user?.id} disabled />
          </div>
          <Button>Update profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsItem({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
      <Icon className="w-6 h-6 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
