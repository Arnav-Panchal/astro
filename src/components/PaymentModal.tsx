
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { saveQuestion, saveChatMessage, generateId } from '@/lib/store';
import type { AstroQuestion, ChatMessage } from '@/lib/types';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';

import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, CreatePaymentIntentResponse } from '@/app/actions/stripeActions';
import { cn } from '@/lib/utils';

// Initialize Stripe.js with your publishable key.
// Replace 'pk_test_YOUR_PUBLISHABLE_KEY' with your actual Stripe publishable key or use an environment variable.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OEyWcSA8LPT3Bs4nAGc9fTgg2H9o06u5n5tX7T7bYxK0E2C1sU8D5qY0Z1jJ9eF9xY5Z0v0lQ8sR7e00eWd9vQbB'); // Example Test Key

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  onPaymentSuccess: (questionId: string) => void;
  randomNumber: number;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "hsl(var(--foreground))", // Adapting to theme's foreground
      fontFamily: 'Alegreya, serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "hsl(var(--muted-foreground))",
      },
      iconColor: "hsl(var(--accent))",
    },
    invalid: {
      color: "hsl(var(--destructive))",
      iconColor: "hsl(var(--destructive))",
    },
  },
};

const CheckoutForm: React.FC<Omit<PaymentModalProps, 'isOpen' | 'onOpenChange'>> = ({ questionText, onPaymentSuccess, randomNumber }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setPaymentError("Stripe.js has not loaded yet. Please wait a moment and try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError("Card details are missing or incomplete.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // 1. Create a PaymentIntent on the server
    const paymentAmountCents = 1000; // $10.00 in cents
    const response: CreatePaymentIntentResponse = await createPaymentIntent(paymentAmountCents);

    if (response.error || !response.clientSecret) {
      setPaymentError(response.error || "Failed to initialize payment. Please try again.");
      setIsProcessing(false);
      return;
    }

    // 2. Confirm the card payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(response.clientSecret, {
      payment_method: {
        card: cardElement,
        // billing_details: { name: 'Jenny Rosen' }, // Optional: Collect billing details
      },
    });

    if (stripeError) {
      setPaymentError(stripeError.message || "An unexpected error occurred during payment.");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) { // Check for 'requires_capture' for some payment methods
      // Payment successful, save question and messages
      const questionId = generateId('q_');
      const userId = generateId('user_');
      const timestamp = new Date().toISOString();

      const newQuestion: AstroQuestion = {
        id: questionId,
        userId,
        userName: `User ${userId.substring(5, 9)}`,
        questionText,
        randomNumber,
        timestamp,
        status: 'pending',
        hasUnreadUserMessage: true,
        hasUnreadAstrologerMessage: false,
      };

      const initialMessage: ChatMessage = {
        id: generateId('msg_'),
        questionId,
        sender: 'user',
        text: questionText,
        timestamp,
      };

      saveQuestion(newQuestion);
      saveChatMessage(questionId, initialMessage);
      dispatchNotificationUpdate('astrologer');

      toast({
        title: "Payment Successful!",
        description: "Your question has been sent to the astrologer.",
        variant: "default",
      });
      onPaymentSuccess(questionId);
    } else {
      setPaymentError("Payment did not succeed. Please try again or contact support.");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="py-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Your Question:</p>
        <p className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto border border-border">{questionText}</p>
        <p className="text-sm text-muted-foreground">
          Your special number: <span className="font-bold text-accent">{randomNumber}</span>
        </p>
        
        <div className="space-y-2 pt-2">
            <label htmlFor="card-element" className="block text-sm font-medium text-foreground">
                Payment Details
            </label>
            <div id="card-element" className="p-3 border border-input rounded-md bg-background shadow-sm">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
        </div>

        {paymentError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="flex items-center justify-center p-4 border border-dashed border-accent/50 rounded-md bg-accent/10 mt-2">
          <p className="text-lg font-semibold text-accent">Total: $10.00</p>
        </div>
      </div>
      <DialogFooter className="pt-2">
        <DialogClose asChild>
          <Button variant="outline" disabled={isProcessing} className="border-border hover:bg-muted">Cancel</Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? 'Processing...' : 'Pay & Ask'}
        </Button>
      </DialogFooter>
    </form>
  );
};


const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onOpenChange, questionText, onPaymentSuccess, randomNumber }) => {
  const options: StripeElementsOptions = {
    // clientSecret will be fetched dynamically, so not setting it here initially
    // appearance can be customized if needed
    appearance: {
      theme: 'stripe', // or 'night', 'flat', or your custom theme
       variables: {
        colorPrimary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
        colorBackground: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(), // use card as modal background
        colorText: getComputedStyle(document.documentElement).getPropertyValue('--card-foreground').trim(),
        colorDanger: getComputedStyle(document.documentElement).getPropertyValue('--destructive').trim(),
        fontFamily: 'Alegreya, Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px', // Example
        borderRadius: 'var(--radius)', // Example, using CSS variable
      },
       rules: {
        '.Input': {
          borderColor: 'hsl(var(--input))',
          backgroundColor: 'transparent', // Ensure input background is transparent to pick up modal bg
        },
        '.Input:focus': {
          borderColor: 'hsl(var(--ring))',
          boxShadow: `0 0 0 1px hsl(var(--ring))`,
        },
      }
    },
  };
  
  // Conditionally render Elements provider only when isOpen to ensure clientSecret context if needed later,
  // and manage Stripe resources effectively.
  // For now, clientSecret is fetched inside CheckoutForm.
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground shadow-xl rounded-lg border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Confirm Your Question</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please enter your payment details to send your question to the astrologer.
          </DialogDescription>
        </DialogHeader>
        {isOpen && ( // Ensure Elements is only rendered when the modal is open
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm 
              questionText={questionText} 
              onPaymentSuccess={(questionId) => {
                onPaymentSuccess(questionId);
                onOpenChange(false); // Close modal on success
              }} 
              randomNumber={randomNumber} 
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
