import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp, 
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuthContext } from '@/components/AuthProvider';
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
  const [state, setState] = useState<CollectionsState>(initialState);
  
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, collections: [], games: {}, loading: false }));
      return;
    }

    const collectionsQuery = query(
      collection(db, 'collections'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(collectionsQuery, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as CollectionWithDates[];

      setState(prev => ({
        ...prev,
        collections: collectionsData,
        loading: false
      }));
    }, (error) => {
      console.error(`Collection update error: ${error.message}`);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
            Error: 'Failed to fetch games',
            loading: false
          }));
        }
      }
    };

    fetchGames();
    return () => abortController.abort();
  }, [user?.uid, state.collections]);

  const createCollection = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const newCollection: Omit<Collection, 'id'> = {
        name,
        ...(description ? { description } : {}),
        gameIds: [],
        userId: user.uid,
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
      console.error(error instanceof Error ? error.message : "Failed to create collection");
      return null;
    }
  };

  const addGameToCollection = async (collectionId: string, gameId: string | number) => {
    if (!user?.uid) return false;
    
    try {
      // Ensure gameId is a string
      const gameIdString = gameId.toString();
      
      // If adding to 'all' and there are no collections, create one
      if (collectionId === 'all' && state.collections.length === 0) {
        const newCollection: Omit<Collection, 'id'> = {
          name: 'My Collection',
          gameIds: [gameIdString],
          userId: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await addDoc(collection(db, 'collections'), newCollection);
        return true;
      }
      
      // If adding to 'all' with existing collections, add to all collections
      if (collectionId === 'all' && state.collections.length > 0) {
        const batch = writeBatch(db);
        state.collections.forEach(collection => {
          const collectionRef = doc(db, 'collections', collection.id);
          batch.update(collectionRef, {
            gameIds: arrayUnion(gameIdString),
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
        return true;
      }
      
      // Add to specific collection
      const colRef = doc(db, 'collections', collectionId);
      await updateDoc(colRef, {
        gameIds: arrayUnion(gameIdString),
        updatedAt: serverTimestamp()
      });
  
      return true;
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Failed to update collection");
      return false;
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!user?.uid) return false;

    try {
      await deleteDoc(doc(db, 'collections', collectionId));
      return true;
    } catch (err) {
      console.error('Error deleting collection:', err);
      return false;
    }
  };

  const getCollectionGames = (collectionId: string): Game[] => {
    if (collectionId === 'all') {
      // Get all unique games from all collections
      const allGameIds = new Set(state.collections.flatMap(c => c.gameIds));
      return Array.from(allGameIds).map(id => state.games[id]).filter(Boolean);
    }

    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) return [];
    return (collection.gameIds || [])
      .map(id => state.games[id])
      .filter(Boolean);
  };

  const removeGameFromCollection = async (collectionId: string, gameId: string) => {
    if (!user?.uid) return false;

    try {
      if (collectionId === 'all') {
        // Remove from all collections including default
        const batch = writeBatch(db);
        const collectionsToUpdate = state.collections.filter(c => c.gameIds.includes(gameId));
        
        for (const collection of collectionsToUpdate) {
          const collectionRef = doc(db, 'collections', collection.id);
          const updatedGameIds = collection.gameIds.filter(id => id !== gameId);
          batch.update(collectionRef, {
            gameIds: updatedGameIds,
            updatedAt: serverTimestamp(),
          });
        }
        
        await batch.commit();
        return true;
      }

      // Remove from specific collection
      const collection = state.collections.find(c => c.id === collectionId);
      if (!collection) return false;

      const updatedGameIds = collection.gameIds.filter(id => id !== gameId);
      
      await updateDoc(doc(db, 'collections', collectionId), {
        gameIds: updatedGameIds,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (err) {
      console.error('Error removing game from collection:', err);
      return false;
    }
  };

  const updateCollection = async (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'userId'>>) => {
    if (!user?.uid) return false;

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