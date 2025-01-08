export interface Message {
  id: string;
  content: string;
  role: 'human' | 'ai';
  timestamp: string;
}
