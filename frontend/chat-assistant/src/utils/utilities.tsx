export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  reply: string;
}

export enum Role {
  USER = 'user',
  MEMBER = 'member',
  SYSTEM = 'system',
  ASSISTANT = 'assistant'
}

export const systemPrompt = `Hello! I\'m your library assistant. 
      I can help you with:\n\n📚 Search books and check availability\n💰 Check fines and penalties\n📅 
      View due dates for borrowed books\n📝 Check book request status\n✍️ Find books by author\n🔔 
      View notifications\n\nHow can I help you today?`

export const errorResponsePrompt = (errorMessage: string) => `Sorry, I encountered an error: ${errorMessage}`;