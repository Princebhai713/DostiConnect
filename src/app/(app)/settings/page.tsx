import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currentUser } from '@/lib/data';
import { Camera, LogOut, Shield, KeyRound, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="relative">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-7 w-7">
                    <Camera className="h-4 w-4" />
                </Button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-muted-foreground">@{currentUser.id}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-1">
            <SettingsItem icon={KeyRound} title="Account" description="Privacy, security, change number" />
            <SettingsItem icon={Bell} title="Notifications" description="Messages, group & call tones" />
            <SettingsItem icon={LogOut} title="Log Out" description="Log out from your account" isLink href="/login" />
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
            <Input id="name" defaultValue={currentUser.name} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue={currentUser.id} />
          </div>
          <Button>Update profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsItem({ icon: Icon, title, description, isLink, href }: { icon: React.ElementType, title: string, description: string, isLink?: boolean, href?: string }) {
    const content = (
        <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
            <Icon className="w-6 h-6 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );

    if (isLink && href) {
        return <Link href={href}>{content}</Link>
    }

    return content;
}
