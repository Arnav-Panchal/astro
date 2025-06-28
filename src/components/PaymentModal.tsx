
"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

import { createRazorpayOrder } from '@/app/actions/stripeActions'; // Note: You may want to rename stripeActions.ts to razorpayActions.ts
import { saveQuestion, saveChatMessage, generateId } from '@/lib/store';
import type { AstroQuestion, ChatMessage } from '@/lib/types';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';

// Define Razorpay on the window object for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  onPaymentSuccess: (questionId: string) => void;
  randomNumber: number;
}


const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onOpenChange, questionText, randomNumber, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    // 1. Create a Razorpay Order
    const paymentAmount = 1000; // ₹10.00 (1000 paise)
    const orderResponse = await createRazorpayOrder(paymentAmount);

    if (orderResponse.error || !orderResponse.orderId) {
      setError(orderResponse.error || "Failed to create payment order. Please try again.");
      setIsProcessing(false);
      return;
    }

    const orderId = orderResponse.orderId;
    const questionId = generateId('q_');

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, // Your Razorpay Key ID from .env.local
      amount: paymentAmount,
      currency: "INR",
      name: "AstroConnect",
      description: "Astrology Question Payment",
      order_id: orderId,
      handler: function (response: any) {
        // 2. This function is called after successful payment
        const userId = generateId('user_');
        const userName = `User ${userId.substring(5,9)}`;
        const timestamp = new Date().toISOString();

        const newQuestion: AstroQuestion = {
          id: questionId,
          userId,
          userName,
          questionText,
          randomNumber,
          timestamp,
          status: 'pending',
          hasUnreadUserMessage: true,
          hasUnreadAstrologerMessage: false,
        };

        const initialMessage: ChatMessage = {
          id: generateId('msg_'),
          questionId: questionId,
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
        
        onOpenChange(false); // Close the modal
        onPaymentSuccess(questionId); // Trigger redirect to chat page
      },
      prefill: {
          name: "AstroConnect User",
          email: "user@example.com",
          contact: "9999999999"
      },
      notes: {
          questionId: questionId,
          question: questionText.substring(0, 20) + "..."
      },
      theme: {
          color: "#4B0082" // Deep Indigo to match your theme
      },
      modal: {
        ondismiss: function() {
          // This function is called when the user closes the modal without completing the payment
          if (isProcessing) { // Only update state if we were actually processing
             setIsProcessing(false);
             setError("Payment was not completed.");
          }
        }
      }
    };
    
    // 3. Open Razorpay Checkout
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // When modal is closed, reset state
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setIsProcessing(false);
        setError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground shadow-xl rounded-lg border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Confirm Your Question</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            A small fee is required to connect with our expert astrologer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Your Question:</p>
            <p className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto border border-border">{questionText}</p>
            <p className="text-sm text-muted-foreground">
            Your special number: <span className="font-bold text-accent">{randomNumber}</span>
            </p>

             {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-center p-3 border border-dashed border-accent/50 rounded-md bg-accent/10 mt-3">
              <p className="text-lg font-semibold text-accent">Total: ₹10.00</p>
            </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="border-border hover:bg-muted">Cancel</Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <>
                <Send className="mr-2 h-4 w-4" />
                Proceed to Pay ₹10.00
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
