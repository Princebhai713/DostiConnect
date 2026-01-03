'use client';

import { useState, useEffect, FormEvent } from 'react';
import usePartySocket from 'partysocket/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type User = {
  id: string;
  name: string;
};

type Message = {
    id: string;
    sender: User;
    text: string;
    timestamp: number;
}

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast()

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
        if (message.user.id !== currentUser?.id) {
            toast({
                title: "New user joined! 👋",
                description: `${message.user.name} is now online.`,
            })
        }
      }
      if (message.type === 'user-left') {
        const leftUser = onlineUsers.find(u => u.id === message.id);
        if (leftUser) {
             toast({
                title: "User left 🏃",
                description: `${leftUser.name} went offline.`,
            })
        }
        setOnlineUsers((prev) => prev.filter((u) => u.id !== message.id));
      }
      if (message.type === 'welcome') {
        setCurrentUser(message.user);
      }
      if (message.type === 'new-message') {
        setMessages((prev) => [...prev, message.message]);
      }
    },
  });

  useEffect(() => {
    if (!currentUser && socket.readyState === WebSocket.OPEN) {
       socket.send(JSON.stringify({ type: 'identify' }));
    }
  }, [currentUser, socket.readyState, socket]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    const message = {
        type: 'new-message',
        text: newMessage,
    };
    socket.send(JSON.stringify(message));
    setNewMessage('');
  }

  return (
    <main className="flex h-screen bg-background text-foreground">
      <div className="flex flex-1">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          <header className="border-b p-4">
            <h1 className="text-2xl font-bold">DostiConnect Chat</h1>
            <p className="text-sm text-muted-foreground">
                Connected as <span className="font-semibold text-primary">{currentUser?.name || '...'}</span>
            </p>
          </header>

          <ScrollArea className="flex-1 p-4">
             <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender.id === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-xs font-semibold mb-1">{msg.sender.name}</p>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground pt-10">
                        No messages yet. Say hi!
                    </div>
                )}
             </div>
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <Button type="submit" size="icon" disabled={!currentUser}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <aside className="w-64 border-l flex flex-col">
           <div className="p-4 border-b">
             <h2 className="text-lg font-semibold">Online Users ({onlineUsers.length})</h2>
           </div>
           <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
                {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="font-medium">{user.name}</span>
                        {user.id === currentUser?.id && <Badge variant="outline">You</Badge>}
                    </div>
                ))}
            </div>
           </ScrollArea>
        </aside>
      </div>
    </main>
  );
}
