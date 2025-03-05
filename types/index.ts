import { Timestamp } from 'firebase/firestore';
import { Game } from './game';

export type { Game };

export interface GameDetails extends Game {
  description: string;
  screenshots: string[];
  website?: string;
  metacritic_url?: string;
  developers: string[];
  publishers: string[];
  platforms: {
    platform: string;
    released_at?: string;
    requirements?: {
      minimum?: string;
      recommended?: string;
    };
  }[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  userId: string;
  darkMode: boolean;
  emailNotifications: boolean;
  theme: 'dark' | 'light' | 'system';
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  bio?: string;
  favoriteGenres?: string[];
  favoritePlatforms?: string[];
  updatedAt: Date;
}
