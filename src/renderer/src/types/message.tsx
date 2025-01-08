export interface Message {
    id: string;
    content: string;
    role: 'ai' | 'human';
    timestamp: Date;
}
