"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { saveQuestion, saveChatMessage, generateId } from '@/lib/store';
import type { AstroQuestion, ChatMessage } from '@/lib/types';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  onPaymentSuccess: (questionId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onOpenChange, questionText, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Generate random number when modal opens (client-side)
      setRandomNumber(Math.floor(Math.random() * 249) + 1);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!randomNumber) {
      toast({
        title: "Error",
        description: "Could not generate a number for your question. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

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


    setIsProcessing(false);
    onOpenChange(false); 

    toast({
      title: "Payment Successful!",
      description: "Your question has been sent to the astrologer.",
      variant: "default", 
    });
    
    onPaymentSuccess(questionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground shadow-xl rounded-lg border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Confirm Your Question</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please confirm payment to send your question to the astrologer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Your Question:</p>
          <p className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto border border-border">{questionText}</p>
          {randomNumber && (
            <p className="text-sm text-muted-foreground">
              A special number for your question: <span className="font-bold text-accent">{randomNumber}</span>
            </p>
          )}
          <div className="flex items-center justify-center p-4 border border-dashed border-accent/50 rounded-md bg-accent/10">
            <p className="text-lg font-semibold text-accent">Total: $10.00 (Mock Payment)</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="outline" disabled={isProcessing} className="border-border hover:bg-muted">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Pay & Ask'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
