
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { saveQuestion, saveChatMessage, generateId } from '@/lib/store';
import type { AstroQuestion, ChatMessage } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import UserHeader from '@/components/UserHeader'; // Optional: for consistent header
import { dispatchNotificationUpdate } from '@/components/NotificationBell';

// Initialize Stripe.js with your publishable key.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OEyWcSA8LPT3Bs4nAGc9fTgg2H9o06u5n5tX7T7bYxK0E2C1sU8D5qY0Z1jJ9eF9xY5Z0v0lQ8sR7e00eWd9vQbB');

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing'>('loading');
  const [finalQuestionId, setFinalQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntentId = searchParams.get('payment_intent'); // Stripe often passes this
    // const questionIdFromUrl = searchParams.get('questionId'); // This was set in return_url

    if (!clientSecret || !paymentIntentId) {
      setMessage('Payment details are missing. Unable to confirm status.');
      setStatus('error');
      return;
    }
    
    setStatus('processing');

    const checkStatus = async () => {
      const stripe = await stripePromise;
      if (!stripe) {
        setMessage('Stripe.js failed to load.');
        setStatus('error');
        return;
      }

      const { paymentIntent: retrievedPaymentIntent, error: retrieveError } = await stripe.retrievePaymentIntent(clientSecret);

      if (retrieveError) {
        setMessage(`Error retrieving payment status: ${retrieveError.message}`);
        setStatus('error');
        return;
      }

      if (retrievedPaymentIntent) {
        switch (retrievedPaymentIntent.status) {
          case 'succeeded':
            setMessage('Payment successful! Your question is being submitted.');
            setStatus('success');
            
            // Retrieve data from localStorage
            const storedQuestionId = localStorage.getItem('pendingPaymentQuestionId');
            const questionText = localStorage.getItem('pendingPaymentQuestionText');
            const randomNumberString = localStorage.getItem('pendingPaymentRandomNumber');

            if (!storedQuestionId || !questionText || !randomNumberString) {
                setMessage('Could not retrieve question details after payment. Please contact support.');
                setStatus('error');
                // Clean up any partial data
                localStorage.removeItem('pendingPaymentQuestionId');
                localStorage.removeItem('pendingPaymentQuestionText');
                localStorage.removeItem('pendingPaymentRandomNumber');
                return;
            }
            setFinalQuestionId(storedQuestionId);

            const randomNumber = parseInt(randomNumberString, 10);
            const userId = generateId('user_'); // Generate a user ID
            const userName = `User ${userId.substring(5,9)}`; // Create a display name
            const timestamp = new Date().toISOString();

            const newQuestion: AstroQuestion = {
              id: storedQuestionId,
              userId,
              userName,
              questionText,
              randomNumber,
              timestamp,
              status: 'pending',
              hasUnreadUserMessage: true, // User just asked
              hasUnreadAstrologerMessage: false,
            };

            const initialMessage: ChatMessage = {
              id: generateId('msg_'),
              questionId: storedQuestionId,
              sender: 'user',
              text: questionText,
              timestamp,
            };

            saveQuestion(newQuestion);
            saveChatMessage(storedQuestionId, initialMessage);
            dispatchNotificationUpdate('astrologer');


            toast({
              title: "Payment Successful!",
              description: "Your question has been sent to the astrologer.",
              variant: "default",
            });

            // Clean up localStorage
            localStorage.removeItem('pendingPaymentQuestionId');
            localStorage.removeItem('pendingPaymentQuestionText');
            localStorage.removeItem('pendingPaymentRandomNumber');
            
            // Redirect to chat after a short delay
            setTimeout(() => {
              router.push(`/chat?questionId=${storedQuestionId}`);
            }, 2000);

            break;
          case 'processing':
            setMessage('Payment processing. We will update you when payment is confirmed.');
            setStatus('processing'); // Or a specific "pending" status
            break;
          case 'requires_payment_method':
            setMessage('Payment failed. Please try another payment method.');
            setStatus('error');
            break;
          default:
            setMessage(`Payment status: ${retrievedPaymentIntent.status}. Please try again or contact support.`);
            setStatus('error');
            break;
        }
      } else {
        setMessage('Could not retrieve payment status. Please try again.');
        setStatus('error');
      }
    };

    checkStatus();
  }, [searchParams, router, toast]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center text-primary">
            {status === 'loading' && 'Checking Payment Status...'}
            {status === 'processing' && 'Processing Your Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Issue'}
          </CardTitle>
           {message && <CardDescription className="text-center pt-2">{message}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
          {status === 'loading' || status === 'processing' ? (
            <Loader2 className="h-16 w-16 animate-spin text-accent" />
          ) : status === 'success' ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <AlertTriangle className="h-16 w-16 text-destructive" />
          )}

          {status === 'success' && finalQuestionId && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Redirecting you to your chat shortly...</p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={`/chat?questionId=${finalQuestionId}`}>
                  Go to Chat Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
          {status === 'error' && (
             <div className="text-center space-y-4">
                <p className="text-muted-foreground">If the issue persists, please contact support or try asking your question again.</p>
                <Button asChild variant="outline">
                    <Link href="/">Ask Another Question</Link>
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function PaymentStatusPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <UserHeader /> {/* Consider if UserHeader is appropriate here or a more generic one */}
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 font-headline">Loading Status...</p></div>}>
          <PaymentStatusContent />
        </Suspense>
      </main>
       <footer className="text-center p-6 text-sm text-muted-foreground/80">
        © {new Date().getFullYear()} AstroConnect. All rights reserved.
      </footer>
    </div>
  );
}

