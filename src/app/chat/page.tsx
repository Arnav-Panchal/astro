"use client";
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserHeader from '@/components/UserHeader';
import ChatInterface from '@/components/ChatInterface';
import { getChatMessages, saveChatMessage, getQuestionById, generateId, clearUserNotification } from '@/lib/store';
import type { ChatMessage, AstroQuestion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';


function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState<AstroQuestion | null | undefined>(undefined); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchChatData = useCallback(() => {
    if (!questionId) return;
    const loadedQuestion = getQuestionById(questionId);
    if (!loadedQuestion) {
      setQuestion(null);
    } else {
      setQuestion(loadedQuestion);
      setMessages(getChatMessages(questionId));
      clearUserNotification(questionId);
      dispatchNotificationUpdate(`user-${questionId}`);
    }
    setIsLoading(false);
  }, [questionId]);

  useEffect(() => {
    if (!questionId) {
      router.replace('/'); 
      return;
    }
    fetchChatData();

    // Poll for new messages (simplified real-time)
    const intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') { // Only poll if tab is active
            const currentMessages = getChatMessages(questionId);
            const currentQuestionState = getQuestionById(questionId);
            // Check if messages or question unread status changed
            if (currentMessages.length !== messages.length || (currentQuestionState && currentQuestionState.hasUnreadAstrologerMessage)) {
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
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    saveChatMessage(questionId, newMessage);
    setMessages(prev => [...prev, newMessage]);
    dispatchNotificationUpdate('astrologer'); // Notify astrologer about new message
    setIsSending(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-headline">Loading your cosmic conversation...</p>
      </div>
    );
  }

  if (question === null) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold font-headline text-destructive mb-2">Chat Not Found</h2>
        <p className="text-muted-foreground mb-6">The stars couldn't align for this chat. It may not exist or an error occurred.</p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/">Ask a New Question</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 space-y-4 max-h-[calc(100vh-4rem)]"> {/* Adjusted max-h for header */}
      <Card className="mb-4 shadow-lg rounded-lg border-border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="font-headline text-xl md:text-2xl text-primary">Your Conversation with the Astrologer</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Regarding your question with Cosmic Number: <span className="font-bold text-accent">{question.randomNumber}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md border border-border"><strong>Your Question:</strong> {question.questionText}</p>
        </CardContent>
      </Card>
      <div className="flex-grow min-h-0"> {/* This div allows ChatInterface to take remaining height */}
         <ChatInterface messages={messages} onSendMessage={handleSendMessage} currentUserType="user" isSending={isSending} placeholderName={question.userName} />
      </div>
    </div>
  );
}


export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <UserHeader />
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 font-headline">Loading Chat...</p></div>}>
          <ChatPageContent />
        </Suspense>
      </main>
    </div>
  );
}
