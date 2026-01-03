import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
      <MessageCircle className="h-24 w-24 text-muted-foreground/50" />
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Select a Chat</h2>
        <p className="text-muted-foreground">Choose one of your friends to start a conversation.</p>
      </div>
    </div>
  );
}
