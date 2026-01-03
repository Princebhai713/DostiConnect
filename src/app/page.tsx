'use client';

import { useState, useEffect } from 'react';
import usePartySocket from 'partysocket/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type User = {
  id: string;
  name: string;
};

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const socket = usePartySocket({
    host: 'dosticonnect-party.gen-studio-a24a.partykit.dev',
    room: 'my-awesome-room',
    onOpen() {
      console.log('connected');
    },
    onMessage(event) {
      const message = JSON.parse(event.data);
      if (message.type === 'sync') {
        setOnlineUsers(message.users);
      }
      if (message.type === 'user-joined') {
        setOnlineUsers((prev) => [...prev, message.user]);
      }
      if (message.type === 'user-left') {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== message.id));
      }
      if (message.type === 'welcome') {
        setCurrentUser(message.user);
      }
    },
  });

  useEffect(() => {
    // This effect ensures we have a stable user object on the client-side
    // to avoid hydration mismatches with server-generated random names.
    if (!currentUser && socket.readyState === WebSocket.OPEN) {
       socket.send(JSON.stringify({ type: 'identify' }));
    }
  }, [currentUser, socket.readyState, socket]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>DostiConnect - Live</CardTitle>
                <CardDescription>
                  Users currently online on this website.
                </CardDescription>
              </div>
              {currentUser && (
                 <Badge variant="secondary">You are: {currentUser.name}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {onlineUsers.length > 1 ? (
              <ul className="space-y-2">
                {onlineUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 rounded-md bg-muted p-3">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    <span>{user.name}</span>
                    {user.id === currentUser?.id && <Badge variant="outline">You</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Looks like you're the only one here right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
