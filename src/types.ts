export type MoodType = 'peaceful' | 'energized' | 'thoughtful' | 'grateful' | 'anxious' | 'neutral';

export interface LocationTag {
  label: string;
  latitude?: number;
  longitude?: number;
}

export interface ReflectionCompassData {
  whatExplored: string;
  keyIdeas: string[];
  possibleNextActions: string[];
  thingsToRevisit: string[];
  reflectionQuestion: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: MoodType;
  tags: string[];
  location?: LocationTag;
  compass?: ReflectionCompassData;
  chatHistory: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  wordCount: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ActiveTab = 'write' | 'history' | 'compass' | 'companion';
