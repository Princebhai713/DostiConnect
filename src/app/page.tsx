'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
         <Card>
          <CardHeader>
            <CardTitle>DostiConnect</CardTitle>
            <CardDescription>Welcome to your new simplified app!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the only page in the application now. All other features have been removed as requested.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
