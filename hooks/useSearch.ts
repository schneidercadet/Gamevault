'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useAuthContext } from '@/components/AuthProvider';
import type { UserProfile } from '@/types/social';

interface SearchOptions {
  type?: 'users' | 'channels' | 'messages';
  limit?: number;
}

export function useSearch<T = UserProfile>() {
  const { user } = useAuthContext();
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string, options: SearchOptions = {}) => {
    // Clear results if query is too short
    if (!user || !searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchQueryLower = searchQuery.toLowerCase().trim();
      let searchResults: T[] = [];

      // Default to users search
      const searchType = options.type || 'users';
      const searchLimit = options.limit || 20;

      switch (searchType) {
        case 'users': {
          // Try exact username match first
          const exactQuery = query(
            collection(db, 'userProfiles'),
            where('username', '==', searchQueryLower),
            limit(1)
          );
          
          const exactMatch = await getDocs(exactQuery);
          
          if (!exactMatch.empty) {
            const doc = exactMatch.docs[0];
            if (doc.id !== user.uid) {
              const data = doc.data();
              searchResults.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                lastSeen: (data.lastSeen as Timestamp)?.toDate() || new Date(),
              } as T);
            }
          }

          // Then try partial matches if we don't have an exact match
          if (searchResults.length === 0) {
            const partialQuery = query(
              collection(db, 'userProfiles'),
              where('username', '>=', searchQueryLower),
              where('username', '<=', searchQueryLower + '\uf8ff'),
              limit(searchLimit)
            );

            const partialMatches = await getDocs(partialQuery);

            partialMatches.forEach(doc => {
              if (doc.id !== user.uid && !searchResults.some(r => r.id === doc.id)) {
                const data = doc.data();
                searchResults.push({
                  id: doc.id,
                  ...data,
                  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                  lastSeen: (data.lastSeen as Timestamp)?.toDate() || new Date(),
                } as T);
              }
            });

            // Also try display name matches
            const displayNameQuery = query(
              collection(db, 'userProfiles'),
              where('displayName', '>=', searchQueryLower),
              where('displayName', '<=', searchQueryLower + '\uf8ff'),
              limit(searchLimit)
            );

            const displayNameMatches = await getDocs(displayNameQuery);

            displayNameMatches.forEach(doc => {
              if (doc.id !== user.uid && !searchResults.some(r => r.id === doc.id)) {
                const data = doc.data();
                searchResults.push({
                  id: doc.id,
                  ...data,
                  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                  lastSeen: (data.lastSeen as Timestamp)?.toDate() || new Date(),
                } as T);
              }
            });
          }

          // Sort results by relevance
          searchResults.sort((a, b) => {
            const aUsername = ((a as any).username || '').toLowerCase();
            const bUsername = ((b as any).username || '').toLowerCase();
            const aDisplayName = ((a as any).displayName || '').toLowerCase();
            const bDisplayName = ((b as any).displayName || '').toLowerCase();
            
            // Exact username matches first
            if (aUsername === searchQueryLower) return -1;
            if (bUsername === searchQueryLower) return 1;
            
            // Then exact display name matches
            if (aDisplayName === searchQueryLower) return -1;
            if (bDisplayName === searchQueryLower) return 1;
            
            // Then sort by username
            return aUsername.localeCompare(bUsername);
          });

          // Limit final results
          searchResults = searchResults.slice(0, searchLimit);
          break;
        }
        // Add other search types here if needed
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    results,
    loading,
    error,
    search
  };
}
