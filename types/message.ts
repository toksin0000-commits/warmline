export interface Message {
  id: string;
  type: 'text' | 'voice';
  content?: string;
  voiceUrl?: string;
  created: number;
}