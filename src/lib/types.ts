
export interface AstroQuestion {
  id: string;
  userId: string;
  userName: string;
  questionText: string;
  randomNumber: number;
  timestamp: string; // ISO string for date
  status: 'pending' | 'answered' | 'viewed_by_astrologer';
  hasUnreadUserMessage: boolean;
  hasUnreadAstrologerMessage: boolean;
}

export interface ChatMessage {
  id:string;
  questionId: string;
  sender: 'user' | 'astrologer';
  text: string;
  timestamp: string; // ISO string for date
}
