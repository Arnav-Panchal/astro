"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, Send } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { useRouter } from 'next/navigation';

const UserQuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = (questionId: string) => {
    router.push(`/chat?questionId=${questionId}`);
  };

  return (
    <>
      <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-xl border-border">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
             <HelpCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Ask the Stars</CardTitle>
          <CardDescription className="text-muted-foreground text-base mt-2">
            Type your question below. Our astrologer will provide insightful guidance.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="px-6 sm:px-8">
            <Textarea
              placeholder="E.g., What do the stars say about my career path this year?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              className="resize-none text-base focus:ring-accent border-input p-3"
              required
              aria-label="Your astrological question"
            />
          </CardContent>
          <CardFooter className="px-6 sm:px-8 pb-6 sm:pb-8">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
              disabled={!question.trim()}
            >
              <Send className="mr-2 h-5 w-5" />
              Proceed to Payment
            </Button>
          </CardFooter>
        </form>
      </Card>
      {isPaymentModalOpen && (
         <PaymentModal
            isOpen={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            questionText={question}
            onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default UserQuestionForm;
