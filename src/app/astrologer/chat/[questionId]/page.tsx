"use client";
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AstrologerHeader from '@/components/AstrologerHeader';
import ChatInterface from '@/components/ChatInterface';
import { getChatMessages, saveChatMessage, getQuestionById, generateId, clearAstrologerQuestionNotification } from '@/lib/store';
import type { ChatMessage, AstroQuestion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';
import { generateAstrologyReply } from '@/ai/flows/astrologer-flow';
import { useToast } from "@/hooks/use-toast";


function AstrologerChatPageContent() {
  const router = useRouter();
  const params = useParams();
  const questionId = typeof params.questionId === 'string' ? params.questionId : undefined;
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState<AstroQuestion | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchChatData = useCallback(() => {
    if (!questionId) return;
    const loadedQuestion = getQuestionById(questionId);
    if (!loadedQuestion) {
      setQuestion(null);
    } else {
      setQuestion(loadedQuestion);
      setMessages(getChatMessages(questionId));
      clearAstrologerQuestionNotification(questionId);
      dispatchNotificationUpdate('astrologer');
    }
    setIsLoading(false);
  }, [questionId]);
  
  useEffect(() => {
    if (!questionId) {
      router.replace('/astrologer'); 
      return;
    }
    fetchChatData();

    // Poll for new messages
     const intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') { // Only poll if tab is active
            const currentMessages = getChatMessages(questionId);
            const currentQuestionState = getQuestionById(questionId);
            if (currentMessages.length !== messages.length || (currentQuestionState && currentQuestionState.hasUnreadUserMessage)) {
                fetchChatData();
            }
        }
    }, 3000);

    return () => clearInterval(intervalId);

  }, [questionId, router, fetchChatData, messages.length]);


  const handleSendMessage = (text: string) => {
    if (!questionId || !question) return;
    setIsSending(true);

    const newMessage: ChatMessage = {
      id: generateId('msg_'),
      questionId,
      sender: 'astrologer',
      text,
      timestamp: new Date().toISOString(),
    };
    saveChatMessage(questionId, newMessage);
    setMessages(prev => [...prev, newMessage]);
    
    // Notify user related to this specific question
    dispatchNotificationUpdate(`user-${questionId}`);
    setIsSending(false);
  };

  const handleGenerateReply = async (): Promise<string | null> => {
    if (!question) return null;
    setIsGenerating(true);
    try {
        const result = await generateAstrologyReply({
            questionText: question.questionText,
            userName: question.userName,
            randomNumber: question.randomNumber
        });
        return result.reply;
    } catch (e) {
        console.error("Error generating AI reply:", e);
        toast({
            title: "Error Generating Reply",
            description: "The cosmic energies seem disturbed. Please try again or write a reply manually.",
            variant: "destructive",
        });
        return null;
    } finally {
        setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-headline">Loading celestial records...</p>
      </div>
    );
  }

  if (question === null) {
     return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold font-headline text-destructive mb-2">Question Not Found</h2>
        <p className="text-muted-foreground mb-6">This question session seems to have vanished into the cosmos.</p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/astrologer">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 space-y-4 max-h-[calc(100vh-4rem)]"> {/* Adjusted max-h */}
        <Card className="mb-4 shadow-lg rounded-lg border-border">
            <CardHeader className="p-4 md:p-6">
                <CardTitle className="font-headline text-xl md:text-2xl text-primary">Chat with {question.userName}</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                    Replying to their question (Cosmic Number: <span className="font-bold text-accent">{question.randomNumber}</span>)
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
                 <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md border border-border"><strong>Original Question:</strong> "{question.questionText}"</p>
            </CardContent>
        </Card>
        <div className="flex-grow min-h-0">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            currentUserType="astrologer" 
            isSending={isSending} 
            placeholderName="Astrologer"
            onGenerateAiReply={handleGenerateReply}
            isGeneratingAiReply={isGenerating}
          />
        </div>
    </div>
  );
}

export default function AstrologerChatIdPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AstrologerHeader />
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 font-headline">Loading Chat...</p></div>}>
          <AstrologerChatPageContent />
        </Suspense>
      </main>
    </div>
  );
}
