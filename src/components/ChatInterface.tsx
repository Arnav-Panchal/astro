"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, UserCircle, Sparkles, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserType: 'user' | 'astrologer';
  isSending?: boolean; // To show loading state on send button
  placeholderName?: string; // For astrologer or user avatar fallback
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, currentUserType, isSending, placeholderName }) => {
  const [inputText, setInputText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() && !isSending) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, HH:mm');
    } catch (e) {
      console.warn("Invalid date for formatting:", timestamp);
      return "Sending...";
    }
  };


  return (
    <div className="flex flex-col h-full bg-card shadow-lg rounded-lg overflow-hidden border border-border">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out",
                msg.sender === currentUserType ? "justify-end" : "justify-start"
              )}
            >
              {msg.sender !== currentUserType && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback className={cn(
                      "text-sm",
                      msg.sender === 'astrologer' ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                    )}
                  >
                    {msg.sender === 'user' ? <UserCircle strokeWidth={1.5} /> : <Sparkles strokeWidth={1.5} />}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] p-3 rounded-xl shadow-md",
                  msg.sender === currentUserType
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none border border-border"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <p className={cn(
                    "text-xs mt-1.5 opacity-80",
                     msg.sender === currentUserType ? "text-right" : "text-left"
                )}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
              {msg.sender === currentUserType && (
                 <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback className={cn(
                      "text-sm",
                      msg.sender === 'astrologer' ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                    )}
                  >
                    {msg.sender === 'user' ? <UserCircle strokeWidth={1.5} /> : <Sparkles strokeWidth={1.5} />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {messages.length === 0 && !isSending && (
            <div className="text-center text-muted-foreground py-10">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-grow resize-none text-sm min-h-[44px] max-h-[120px] focus:ring-accent rounded-lg p-3 border-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
          />
          <Button onClick={handleSend} size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg h-11 w-11 shadow-md hover:shadow-lg transition-shadow" disabled={isSending || !inputText.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
