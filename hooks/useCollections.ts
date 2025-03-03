/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import { useError } from '@/contexts/ErrorContext';
import { Game } from '@/types/game';

interface Collection {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CollectionWithDates {
  id: string;
  name: string;
  description?: string;
  gameIds: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CollectionsState {
  collections: CollectionWithDates[];
  games: { [key: string]: Game };
  loading: boolean;
  error: Error | null;
}

const initialState: CollectionsState = {
  collections: [],
  games: {},
  loading: true,
  error: null,
};

function useCollections() {
  const { user } = useAuthContext();
  const { setError } = useError();
  const [state, setState] = useState<CollectionsState>(initialState);
  
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Setting up collections listener for user:', user.uid);
    setState(prev => ({ ...prev, loading: true }));

    const q = query(
      collection(db, 'collections'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const updatedCollections: CollectionWithDates[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert timestamps to Date objects
          const collection: CollectionWithDates = {
            id: doc.id,
            name: data.name,
            description: data.description,
            gameIds: data.gameIds || [],
            userId: data.userId,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date()
          };
          
          updatedCollections.push(collection);
        });

        console.log(`Loaded ${updatedCollections.length} collections for user ${user.uid}`);
        
        setState(prev => ({
          ...prev,
          collections: updatedCollections,
          loading: false
        }));
      } catch (error) {
        console.error('Error in collections snapshot:', error);
        setError(error instanceof Error ? error : new Error('Failed to load collections'));
        setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error : new Error('Failed to load collections') }));
      }
    }, (error) => {
      console.error('Collection snapshot error:', error);
      setError(error);
      setState(prev => ({ ...prev, loading: false, error }));
    });

    return () => unsubscribe();
  }, [user?.uid, db, setError]);

  useEffect(() => {
    if (!user?.uid) return;

    const abortController = new AbortController();

    const fetchGames = async () => {
      try {
        const gameIds = new Set(state.collections.flatMap(c => c.gameIds || []));
        const gamesData: { [key: string]: Game } = {};
        
        for (const gameId of gameIds) {
          if (!gameId || abortController.signal.aborted) continue;
          
          try {
            const response = await fetch(`/api/games/${gameId}`);
            if (!response.ok) continue;
            const gameData = await response.json();
            gamesData[gameId] = gameData;
          } catch (err) {
            console.error(`Error fetching game ${gameId}:`, err);
          }
        }

        if (!abortController.signal.aborted) {
          setState(prev => ({
            ...prev,
            games: gamesData,
            error: null,
            loading: false
          }));
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching games:', err);
          setState(prev => ({
            ...prev,
            error: 'Failed to fetch games',
            loading: false
          }));
        }
      }
    };

    fetchGames();
    return () => abortController.abort();
  }, [user?.uid, state.collections]);

  const createCollection = async (name: string, description?: string): Promise<Collection | null> => {
    // Try both direct auth and context
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error('Cannot create collection: No authenticated user');
      setError(new Error('Authentication required: Please log in to create collections'));
      return null;
    }
    
    try {
      const newCollection: Omit<Collection, 'id'> = {
        name,
        ...(description ? { description } : {}),
        gameIds: [],
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'collections'), newCollection);
      const newCollectionWithId: Collection = {
        id: docRef.id,
        ...newCollection,
      };
      
      return newCollectionWithId;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to create collection'));
      return null;
    }
  };

  const addGameToCollection = async (collectionId: string, gameId: string | number): Promise<boolean> => {
    // Try both direct auth and context for redundancy
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error('Cannot add game to collection: No authenticated user from either direct or context check');
      setError(new Error('Authentication required: Please log in to add games to collections'));
      return false;
    }
    
    const userId = currentUser.uid;
    console.log('User authenticated for collection operation', { 
      userId,
      authMethod: auth.currentUser ? 'direct' : 'context' 
    });
    
    try {
      // Ensure gameId is a string
      const gameIdString = gameId.toString();
      console.log(`Adding game ${gameIdString} to collection ${collectionId}`, {
        collectionCount: state.collections.length,
        userId
      });
      
      // If adding to 'all' and there are no collections, create one
      if (collectionId === 'all' && state.collections.length === 0) {
        console.log('Creating new default collection');
        const newCollection: Omit<Collection, 'id'> = {
          name: 'My Collection',
          gameIds: [gameIdString],
          userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        try {
          await addDoc(collection(db, 'collections'), newCollection);
          console.log('Successfully created new collection with game');
          return true;
        } catch (error) {
          console.error('Error creating default collection:', error);
          throw error; 
        }
      }
      
      if (collectionId === 'all' && state.collections.length > 0) {
        console.log(`Adding game ${gameIdString} to all ${state.collections.length} collections`);
        const batch = writeBatch(db);
        state.collections.forEach(collection => {
          const collectionRef = doc(db, 'collections', collection.id);
          batch.update(collectionRef, {
            gameIds: arrayUnion(gameIdString),
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
        console.log('Successfully added game to all collections');
        return true;
      }
      
      console.log(`Adding game ${gameIdString} to specific collection ${collectionId}`);
      const colRef = doc(db, 'collections', collectionId);
      await updateDoc(colRef, {
        gameIds: arrayUnion(gameIdString),
        updatedAt: serverTimestamp()
      });
      console.log('Successfully added game to collection');
      return true;
    } catch (error) {
      console.error('Error in addGameToCollection:', error);
      setError(error instanceof Error ? error : new Error(`Failed to update collection: ${String(error)}`));
      return false;
    }
  };

  const deleteCollection = async (collectionId: string): Promise<boolean> => {
    // Try both direct auth and context for redundancy
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error('Cannot delete collection: No authenticated user from either direct or context check');
      setError(new Error('Authentication required: Please log in to delete collections'));
      return false;
    }
    
    try {
      await deleteDoc(doc(db, 'collections', collectionId));
      return true;
    } catch (err) {
      console.error('Error deleting collection:', err);
      setState(prev => ({ ...prev, error: 'Failed to delete collection' }));
      return false;
    }
  };

  const getCollectionGames = (collectionId: string): Game[] => {
    if (collectionId === 'all') {
      // Use a Map to track games by ID to deduplicate and preserve game objects
      const gameMap = new Map<string, Game>();
      
      // Gather all game IDs from all collections
      state.collections.flatMap(c => c.gameIds || []).forEach(id => {
        // Only add the game to the map if it exists and hasn't been added yet
        if (state.games[id] && !gameMap.has(id)) {
          gameMap.set(id, state.games[id]);
        }
      });
      
      // Convert the Map values to an array
      return Array.from(gameMap.values());
    }

    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) return [];
    
    // For a specific collection, ensure we have no duplicates
    const uniqueGameIds = Array.from(new Set(collection.gameIds || []));
    return uniqueGameIds
      .map(id => state.games[id])
      .filter(Boolean);
  };

  const removeGameFromCollection = async (collectionId: string, gameId: string): Promise<boolean> => {
    // Try both direct auth and context for redundancy
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error('Cannot remove game from collection: No authenticated user');
      setError(new Error('Authentication required: Please log in to remove games from collections'));
      return false;
    }

    try {
      if (collectionId === 'all') {
        // Remove from all collections including default
        const batch = writeBatch(db);
        const collectionsToUpdate = state.collections.filter(c => c.gameIds.includes(gameId));
        
        if (collectionsToUpdate.length === 0) return false;
        
        collectionsToUpdate.forEach(collection => {
          const colRef = doc(db, 'collections', collection.id);
          batch.update(colRef, {
            gameIds: arrayRemove(gameId),
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        return true;
      }

      // Remove from specific collection
      const collection = state.collections.find(c => c.id === collectionId);
      if (!collection) return false;
      
      const colRef = doc(db, 'collections', collectionId);
      await updateDoc(colRef, {
        gameIds: arrayRemove(gameId),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to remove game from collection'));
      return false;
    }
  };

  const updateCollection = async (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'userId'>>): Promise<boolean> => {
    // Try both direct auth and context for redundancy
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error('Cannot update collection: No authenticated user from either direct or context check');
      setError(new Error('Authentication required: Please log in to update collections'));
      return false;
    }
    
    try {
      const collection = state.collections.find(c => c.id === collectionId);
      if (!collection) return false;

      await updateDoc(doc(db, 'collections', collectionId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error updating collection:', error);
      return false;
    }
  };

  return {
    collections: state.collections,
    loading: state.loading,
    error: state.error,
    createCollection,
    deleteCollection,
    addGameToCollection,
    removeGameFromCollection,
    getCollectionGames,
    updateCollection,
  };
}

export default useCollections;