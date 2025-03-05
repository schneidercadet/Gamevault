import { Timestamp } from 'firebase/firestore';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CollectionWithDates extends Omit<Collection, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}
