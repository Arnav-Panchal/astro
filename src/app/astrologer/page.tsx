"use client";
import { useEffect, useState, useCallback } from 'react';
import AstrologerHeader from '@/components/AstrologerHeader';
import { getQuestions, clearAstrologerQuestionNotification } from '@/lib/store';
import type { AstroQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { MessageSquare, AlertCircle, Inbox, User, Hash, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNowStrict } from 'date-fns';
import { dispatchNotificationUpdate } from '@/components/NotificationBell';


const AstrologerDashboardPage = () => {
  const [questions, setQuestions] = useState<AstroQuestion[]>([]);
  const router = useRouter();

  const fetchQuestions = useCallback(() => {
    setQuestions(getQuestions()); // Store already sorts by timestamp
  }, []);

  useEffect(() => {
    fetchQuestions();
    
    const eventName = 'notificationsUpdated:astrologer';
    window.addEventListener(eventName, fetchQuestions);
    // Fallback for general storage changes
    window.addEventListener('storage', fetchQuestions);


    return () => {
      window.removeEventListener(eventName, fetchQuestions);
      window.removeEventListener('storage', fetchQuestions);
    };
  }, [fetchQuestions]);

  const handleOpenChat = (questionId: string) => {
    clearAstrologerQuestionNotification(questionId); 
    dispatchNotificationUpdate('astrologer'); // Update bell immediately
    router.push(`/astrologer/chat/${questionId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AstrologerHeader />
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-xl rounded-lg border-border">
            <CardHeader className="border-b border-border p-6">
              <CardTitle className="font-headline text-3xl text-primary flex items-center">
                <Inbox className="mr-3 h-8 w-8 text-accent" />
                Client Questions
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Review and respond to incoming astrological queries. Newest questions are at the top.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjusted height */}
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-xl font-semibold font-headline text-muted-foreground">No questions yet.</p>
                    <p className="text-sm text-muted-foreground">New questions from users will appear here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {questions.map((q) => (
                      <li key={q.id} className={`hover:bg-muted/30 transition-colors ${q.hasUnreadUserMessage ? 'bg-accent/5 border-l-4 border-accent' : ''}`}>
                        <div className="p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-grow">
                              <div className="flex items-center mb-2">
                                 {q.hasUnreadUserMessage && <Badge variant="default" className="mr-2 bg-accent text-accent-foreground animate-subtle-pulse shadow-sm">New</Badge>}
                                 <p className="text-sm text-muted-foreground flex items-center"><User className="h-4 w-4 mr-1.5 text-primary/70"/> Client: {q.userName}</p>
                              </div>
                              <h3 className="font-semibold font-headline text-lg text-foreground mb-1.5 line-clamp-2 leading-snug" title={q.questionText}>
                                {q.questionText}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                 <span className="flex items-center"><Hash className="h-3 w-3 mr-1 text-primary/70"/> Cosmic No: <strong className="ml-1 text-accent">{q.randomNumber}</strong></span>
                                 <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-primary/70"/> Received: {formatDistanceToNowStrict(new Date(q.timestamp), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleOpenChat(q.id)} 
                              variant="default" 
                              size="sm"
                              className="mt-2 md:mt-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px] shadow-md hover:shadow-lg transition-shadow"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {q.hasUnreadUserMessage ? 'View & Reply' : 'Open Chat'}
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
             {questions.length > 0 && (
                <CardFooter className="border-t border-border p-4 text-sm text-muted-foreground">
                    Showing {questions.length} question(s).
                </CardFooter>
            )}
          </Card>
        </div>
      </main>
       <footer className="text-center p-6 text-sm text-muted-foreground/80">
        Astrologer Portal © {new Date().getFullYear()} AstroConnect
      </footer>
    </div>
  );
};

export default AstrologerDashboardPage;
