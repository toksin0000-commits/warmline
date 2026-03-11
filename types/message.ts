export type Message = {
  id: string;
  type: 'text' | 'voice';
  content?: string;
  voice_url?: string;
};
