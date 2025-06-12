"use client";
import type { AstroQuestion, ChatMessage } from './types';

const QUESTIONS_KEY = 'astro_questions';
const CHATS_KEY_PREFIX = 'astro_chat_';

// Helper to safely parse JSON from localStorage
const safeJSONParse = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    localStorage.removeItem(key); // Clear corrupted data
    return defaultValue;
  }
};

// Questions Management
export const getQuestions = (): AstroQuestion[] => {
  return safeJSONParse<AstroQuestion[]>(QUESTIONS_KEY, []);
};

export const saveQuestion = (question: AstroQuestion): void => {
  if (typeof window === 'undefined') return;
  const questions = getQuestions();
  const existingIndex = questions.findIndex(q => q.id === question.id);
  if (existingIndex > -1) {
    questions[existingIndex] = question;
  } else {
    questions.unshift(question); // Add new questions to the beginning for chronological order (newest first)
  }
  // Sort by timestamp descending before saving
  questions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
};

export const getQuestionById = (id: string): AstroQuestion | undefined => {
  return getQuestions().find(q => q.id === id);
};

// Chat Messages Management
export const getChatMessages = (questionId: string): ChatMessage[] => {
  return safeJSONParse<ChatMessage[]>(`${CHATS_KEY_PREFIX}${questionId}`, []);
};

export const saveChatMessage = (questionId: string, message: ChatMessage): void => {
  if (typeof window === 'undefined') return;
  const messages = getChatMessages(questionId);
  messages.push(message);
  // Sort messages by timestamp ascending
  messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  localStorage.setItem(`${CHATS_KEY_PREFIX}${questionId}`, JSON.stringify(messages));

  // Update question status regarding unread messages
  const question = getQuestionById(questionId);
  if (question) {
    if (message.sender === 'user') {
      question.hasUnreadUserMessage = true; // For astrologer
      question.status = 'pending'; // Reset status if user sends a new message
    } else { // message.sender === 'astrologer'
      question.hasUnreadAstrologerMessage = true; // For user
      question.hasUnreadUserMessage = false; // Astrologer replied, so clear their 'unread' flag for this interaction
      question.status = 'answered';
    }
    saveQuestion(question);
  }
};

// Notification Management (Simplified)
export const getAstrologerNotificationCount = (): number => {
  return getQuestions().filter(q => q.hasUnreadUserMessage).length;
};

export const clearAstrologerQuestionNotification = (questionId: string): void => {
  const question = getQuestionById(questionId);
  if (question) {
    question.hasUnreadUserMessage = false;
    if(question.status === 'pending') question.status = 'viewed_by_astrologer';
    saveQuestion(question);
  }
};

export const getUserNotificationCount = (questionId: string): number => {
  const question = getQuestionById(questionId);
  return question?.hasUnreadAstrologerMessage ? 1 : 0; // Simplified: 1 if any unread, 0 otherwise
};

export const clearUserNotification = (questionId: string): void => {
  const question = getQuestionById(questionId);
  if (question) {
    question.hasUnreadAstrologerMessage = false;
    saveQuestion(question);
  }
};

// Utility to generate unique IDs
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
