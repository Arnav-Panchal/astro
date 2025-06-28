
"use client";

import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import UserHeader from '@/components/UserHeader';

function PaymentStatusContent() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center text-primary">
            Page Not Found
          </CardTitle>
           <CardDescription className="text-center pt-2">This payment confirmation page is no longer in use.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
            <AlertTriangle className="h-16 w-16 text-destructive" />
             <div className="text-center space-y-4">
                <p className="text-muted-foreground">Please start a new question from the home page.</p>
                <Button asChild variant="outline">
                    <Link href="/">Ask a Question</Link>
                </Button>
             </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function PaymentStatusPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <UserHeader />
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <PaymentStatusContent />
        </Suspense>
      </main>
       <footer className="text-center p-6 text-sm text-muted-foreground/80">
        © {new Date().getFullYear()} AstroConnect. All rights reserved.
      </footer>
    </div>
  );
}
