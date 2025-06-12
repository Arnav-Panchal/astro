
"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, Send, Shuffle, Loader2 } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { useRouter } from 'next/navigation';

const UserQuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState<number | null>(null);
  const [isNumberGenerating, setIsNumberGenerating] = useState(false);
  const router = useRouter();

  const handleGenerateNumber = async () => {
    setIsNumberGenerating(true);
    // Simulate a short delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    const num = Math.floor(Math.random() * 249) + 1;
    setGeneratedNumber(num);
    setIsNumberGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && generatedNumber !== null) {
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
          <CardContent className="px-6 sm:px-8 space-y-4">
            <Textarea
              placeholder="E.g., What do the stars say about my career path this year?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              className="resize-none text-base focus:ring-accent border-input p-3"
              required
              aria-label="Your astrological question"
            />
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Generate your Question's special number from 1 to 249
              </p>
              <div className="flex items-center gap-3">
                <Button
                    type="button"
                    onClick={handleGenerateNumber}
                    className="flex-grow bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md transition-shadow"
                    disabled={isNumberGenerating}
                >
                    {isNumberGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
                    {generatedNumber === null ? 'Generate Number' : 'Re-generate Number'}
                </Button>
                {generatedNumber !== null && (
                  <span className="p-2.5 border border-border rounded-md bg-muted text-foreground font-semibold min-w-[70px] text-center text-sm">
                    {generatedNumber}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 sm:px-8 pb-6 sm:pb-8">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
              disabled={!question.trim() || generatedNumber === null || isNumberGenerating}
            >
              <Send className="mr-2 h-5 w-5" />
              Proceed to Payment
            </Button>
          </CardFooter>
        </form>
      </Card>
      {isPaymentModalOpen && generatedNumber !== null && (
         <PaymentModal
            isOpen={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            questionText={question}
            onPaymentSuccess={handlePaymentSuccess}
            randomNumber={generatedNumber} 
        />
      )}
    </>
  );
};

export default UserQuestionForm;
