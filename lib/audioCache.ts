import { openDB } from 'idb';

const CACHE_NAME = 'audio-cache-v1';
const DB_NAME = 'audio-store';
const STORE_NAME = 'audio-files';

interface AudioMetadata {
  url: string;
  timestamp: number;
  size: number;
  type: string;
}

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

// Cache audio in both Cache API and IndexedDB
export const cacheAudio = async (url: string): Promise<void> => {
  try {
    // Fetch the audio file
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    // Get the audio data as blob
    const blob = await response.clone().blob();
    
    // Store in Cache API
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, response);

    // Store in IndexedDB
    const db = await initDB();
    await db.put(STORE_NAME, blob, url);

    // Store metadata
    const metadata: AudioMetadata = {
      url,
      timestamp: Date.now(),
      size: blob.size,
      type: blob.type,
    };
    await db.put(STORE_NAME, metadata, `${url}_metadata`);

    console.log('Audio cached successfully:', url);
  } catch (error) {
    console.error('Error caching audio:', error);
    throw error;
  }
};

// Get audio from cache, falling back to network
export const getAudio = async (url: string): Promise<Blob | null> => {
  try {
    // Try Cache API first
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(url);

    if (response) {
      console.log('Audio found in Cache API:', url);
      return response.blob();
    }

    // Try IndexedDB next
    const db = await initDB();
    const blob = await db.get(STORE_NAME, url);
    
    if (blob instanceof Blob) {
      console.log('Audio found in IndexedDB:', url);
      return blob;
    }

    // If not in cache, fetch from network and cache it
    console.log('Audio not in cache, fetching from network:', url);
    await cacheAudio(url);
    
    // Get from cache after storing
    response = await cache.match(url);
    return response ? response.blob() : null;

  } catch (error) {
    console.error('Error getting audio:', error);
    return null;
  }
};

// Clear old cache entries (older than 7 days)
export const clearOldCache = async (): Promise<void> => {
  try {
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    // Clear from Cache API
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const date = new Date(response.headers.get('date') || 0);
        if (now - date.getTime() > CACHE_DURATION) {
          await cache.delete(request);
        }
      }
    }

    // Clear from IndexedDB
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_NAME);
    
    for (const key of keys) {
      if (key.toString().endsWith('_metadata')) {
        const metadata = await db.get(STORE_NAME, key) as AudioMetadata;
        if (now - metadata.timestamp > CACHE_DURATION) {
          await db.delete(STORE_NAME, key);
          await db.delete(STORE_NAME, metadata.url);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
