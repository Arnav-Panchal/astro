
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, CreatePaymentIntentResponse } from '@/app/actions/stripeActions';
import { cn } from '@/lib/utils';
// import { saveQuestion, saveChatMessage, generateId } from '@/lib/store'; // Moved to payment-status page
// import type { AstroQuestion, ChatMessage } from '@/lib/types'; // Moved to payment-status page
// import { dispatchNotificationUpdate } from '@/components/NotificationBell'; // Moved to payment-status page


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OEyWcSA8LPT3Bs4nAGc9fTgg2H9o06u5n5tX7T7bYxK0E2C1sU8D5qY0Z1jJ9eF9xY5Z0v0lQ8sR7e00eWd9vQbB');

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  // onPaymentSuccess: (questionId: string) => void; // This will be handled by redirecting from payment-status page
  randomNumber: number;
}

const PAYMENT_ELEMENT_OPTIONS = {
  layout: "tabs" as const, // or "accordion"
  // More options can be found here: https://stripe.com/docs/js/elements_object/create_payment_element#payment_element_create-options
};

interface CheckoutFormProps {
  questionText: string;
  randomNumber: number;
  // onPaymentSuccess: (questionId: string) => void; // Removed, success is handled by redirect
  closeModal: () => void;
  clientSecret: string; // Passed from parent
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ questionText, randomNumber, closeModal, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // const { toast } = useToast(); // Toasting will happen on payment-status page

  // Ref to store questionId to pass to return_url consistently
  const questionIdRef = useRef<string>(`q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setPaymentError("Stripe.js has not loaded yet. Please wait a moment and try again.");
      return;
    }

    const paymentElement = elements.getElement('payment');
    if (!paymentElement) {
      setPaymentError("Payment details module is not ready.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // Store details needed on the payment-status page temporarily
    // A more robust solution for production might involve server-side session or temporary DB record.
    try {
      localStorage.setItem('pendingPaymentQuestionId', questionIdRef.current);
      localStorage.setItem('pendingPaymentQuestionText', questionText);
      localStorage.setItem('pendingPaymentRandomNumber', randomNumber.toString());
      // A temporary unique user ID could be generated here if needed for AstroQuestion.userName
      // For now, userName will be generated on the payment-status page.
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      setPaymentError("Could not prepare for payment securely. Please try again.");
      setIsProcessing(false);
      return;
    }

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      clientSecret, // Ensure this clientSecret is from the *current* PaymentIntent
      confirmParams: {
        return_url: `${window.location.origin}/payment-status?questionId=${questionIdRef.current}&client_secret=${clientSecret}`,
      },
      // redirect: 'if_required' // Default behavior, will redirect if necessary (e.g., for UPI, 3DS)
    });

    // If `confirmPayment` fails, or if it does not redirect (e.g., card error on the spot),
    // an error will be present here.
    if (stripeError) {
      if (stripeError.type === "card_error" || stripeError.type === "validation_error") {
        setPaymentError(stripeError.message || "An error occurred with your payment details.");
      } else {
        setPaymentError(stripeError.message || "An unexpected error occurred during payment processing.");
      }
      setIsProcessing(false); // Allow user to try again or fix details
      // Clear localStorage if payment attempt failed before redirect
      localStorage.removeItem('pendingPaymentQuestionId');
      localStorage.removeItem('pendingPaymentQuestionText');
      localStorage.removeItem('pendingPaymentRandomNumber');
      return;
    }

    // If `confirmPayment` does not return an error, it means Stripe has handled the
    // payment method, and a redirect is likely underway if it was an async method like UPI.
    // If it was a synchronous success (rare without 3DS for cards), the page would redirect to return_url anyway.
    // So, we don't need to handle immediate success here. The payment-status page handles all outcomes.
    // We can keep isProcessing true as the page should navigate away.
    // If, for some reason, it doesn't navigate and there's no error, it's an unexpected state.
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="py-2 space-y-3">
        <p className="text-sm font-medium text-foreground">Your Question:</p>
        <p className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto border border-border">{questionText}</p>
        <p className="text-sm text-muted-foreground">
          Your special number: <span className="font-bold text-accent">{randomNumber}</span>
        </p>
        
        <div className="space-y-2 pt-2">
            <label htmlFor="payment-element" className="block text-sm font-medium text-foreground">
                Payment Details
            </label>
            <div id="payment-element" className="p-1 border-none rounded-md bg-transparent shadow-none">
                <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
            </div>
        </div>

        {paymentError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="flex items-center justify-center p-3 border border-dashed border-accent/50 rounded-md bg-accent/10 mt-3">
          <p className="text-lg font-semibold text-accent">Total: ₹10.00</p>
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={closeModal} disabled={isProcessing} className="border-border hover:bg-muted">Cancel</Button>
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
             "Pay ₹10.00" // Icon removed for PaymentElement consistency
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};


const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onOpenChange, questionText, randomNumber }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingClientSecret, setIsLoadingClientSecret] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && questionText && randomNumber !== null && !clientSecret) { // Fetch only if not already fetched
      const fetchClientSecret = async () => {
        setIsLoadingClientSecret(true);
        setInitializationError(null);
        try {
          const paymentAmount = 1000; // ₹10.00 (1000 paise)
          const response = await createPaymentIntent(paymentAmount);
          if (response.error || !response.clientSecret) {
            setInitializationError(response.error || "Failed to initialize payment. Please try again.");
            setClientSecret(null);
          } else {
            setClientSecret(response.clientSecret);
          }
        } catch (error) {
          console.error("Error fetching client secret:", error);
          setInitializationError("An unexpected error occurred while setting up payment.");
          setClientSecret(null);
        } finally {
          setIsLoadingClientSecret(false);
        }
      };
      fetchClientSecret();
    } else if (!isOpen) {
      // Reset clientSecret when modal is closed to refetch next time it opens
      setClientSecret(null);
      setInitializationError(null);
    }
  }, [isOpen, questionText, randomNumber, clientSecret]);

  const appearanceOptions = {
    theme: 'stripe' as const,
     variables: {
        colorPrimary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
        colorBackground: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),
        colorText: getComputedStyle(document.documentElement).getPropertyValue('--card-foreground').trim(),
        colorDanger: getComputedStyle(document.documentElement).getPropertyValue('--destructive').trim(),
        fontFamily: 'Alegreya, Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: 'var(--radius)',
      },
       rules: {
        '.Input': {
          borderColor: 'hsl(var(--input))',
          backgroundColor: 'transparent',
        },
        '.Input:focus': {
          borderColor: 'hsl(var(--ring))',
          boxShadow: `0 0 0 1px hsl(var(--ring))`,
        },
      }
  };
  
  const options: StripeElementsOptions | undefined = clientSecret ? {
    clientSecret,
    appearance: appearanceOptions,
  } : undefined;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground shadow-xl rounded-lg border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Confirm Your Question</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please select your payment method to send your question to the astrologer.
          </DialogDescription>
        </DialogHeader>

        {isLoadingClientSecret && (
          <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Preparing payment options...</p>
          </div>
        )}

        {initializationError && !isLoadingClientSecret && (
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-destructive font-semibold">Payment Initialization Failed</p>
            <p className="text-sm text-muted-foreground">{initializationError}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}

        {!isLoadingClientSecret && clientSecret && options && isOpen && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm 
              questionText={questionText} 
              randomNumber={randomNumber}
              closeModal={() => onOpenChange(false)}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
