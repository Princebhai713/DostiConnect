import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Users className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">
        DostiConnect
      </h1>
    </div>
  );
}
