'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc as firestoreDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { useAuthContext } from '@/components/AuthProvider';
import type { FriendRequest, UserProfile, ActivityItem, } from '@/types/social';

// Helper function to convert Firestore timestamps to JavaScript Dates
const convertTimestamps = <T extends { [key: string]: any }>(data: T): T => {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result;
};

export function useSocial() {
  const { user } = useAuthContext();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Helper function to check if component is mounted
  const isMounted = () => mountedRef.current;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Search for users
  const searchUsers = async (searchTerm: string) => {
    if (!user || !searchTerm.trim()) return [];
    
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const terms = [searchTermLower];
      
      // Add partial matches
      for (let i = 1; i <= searchTermLower.length; i++) {
        terms.push(searchTermLower.substring(0, i));
      }
      
      const usersQuery = query(
        collection(db, 'userProfiles'),
        where('searchTerms', 'array-contains-any', terms),
        limit(10)
      );
      
      const snapshot = await getDocs(usersQuery);
      const results = snapshot.docs
        .map(doc => ({
          ...convertTimestamps(doc.data()),
          id: doc.id
        }))
        .filter(profile => profile.id !== user.uid); // Exclude current user
        
      return results as UserProfile[];
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
      return [];
    }
  };

  // Subscribe to friend requests
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeFriends: (() => void) | undefined;
    let unsubscribeRequests: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        // Friend requests subscription - include both sent and received requests
        const requestsQuery = query(
          collection(db, 'friendRequests'),
          where('receiverId', '==', user.uid),
          where('status', '==', 'pending')
        );

        const sentRequestsQuery = query(
          collection(db, 'friendRequests'),
          where('senderId', '==', user.uid),
          where('status', '==', 'pending')
        );

        // Combine both subscriptions
        const unsubscribeReceived = onSnapshot(requestsQuery, 
          async (snapshot) => {
            if (!isMounted()) return;
            handleRequestsSnapshot(snapshot, 'received');
          },
          (error) => {
            console.error('Error in received requests subscription:', error);
            if (isMounted()) {
              setError('Failed to load friend requests');
            }
          }
        );

        const unsubscribeSent = onSnapshot(sentRequestsQuery, 
          async (snapshot) => {
            if (!isMounted()) return;
            handleRequestsSnapshot(snapshot, 'sent');
          },
          (error) => {
            console.error('Error in sent requests subscription:', error);
            if (isMounted()) {
              setError('Failed to load friend requests');
            }
          }
        );

        unsubscribeRequests = () => {
          unsubscribeReceived();
          unsubscribeSent();
        };

        // Friends subscription
        const friendsQuery = collection(db, `userProfiles/${user.uid}/friends`);
        unsubscribeFriends = onSnapshot(friendsQuery, 
          async (snapshot) => {
            if (!isMounted()) return;
            handleFriendsSnapshot(snapshot);
          },
          (error) => {
            console.error('Error in friends subscription:', error);
            if (isMounted()) {
              setError('Failed to load friends');
              setLoading(false);
            }
          }
        );
      } catch (err) {
        console.error('Error setting up subscriptions:', err);
        if (isMounted()) {
          setError('Failed to load friends and requests');
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeFriends) unsubscribeFriends();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, [user]);

  const handleRequestsSnapshot = async (snapshot: any, type: 'sent' | 'received') => {
    try {
      console.log(`Processing ${type} requests snapshot with ${snapshot.docs.length} docs`);
      const requests: FriendRequest[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log(`Processing request:`, data);
        
        const request = {
          ...convertTimestamps(data as FriendRequest),
          id: doc.id,
        };

        // Fetch other user's profile (sender for received requests, receiver for sent requests)
        const otherUserId = type === 'received' ? request.senderId : request.receiverId;
        console.log(`Fetching profile for ${otherUserId}`);
        const userDoc = await getDoc(firestoreDoc(db, 'userProfiles', otherUserId));
        
        if (userDoc.exists()) {
          const userData = convertTimestamps(userDoc.data());
          console.log(`Found user profile:`, userData);
          if (type === 'received') {
            request.sender = {
              ...userData,
              id: userDoc.id
            } as UserProfile;
          } else {
            request.receiver = {
              ...userData,
              id: userDoc.id
            } as UserProfile;
          }
        } else {
          console.log(`No profile found for ${otherUserId}`);
        }

        requests.push(request);
      }

      if (isMounted()) {
        setFriendRequests(prev => {
          // Keep requests of the other type
          const otherTypeRequests = prev.filter(r => 
            type === 'sent' ? r.receiverId === user?.uid : r.senderId === user?.uid
          );
          const newState = [...otherTypeRequests, ...requests];
          console.log(`New friend requests state:`, newState);
          return newState;
        });
      }
    } catch (err) {
      console.error('Error handling requests snapshot:', err);
    }
  };

  const handleFriendsSnapshot = async (snapshot: any) => {
    try {
      const friendIds = snapshot.docs.map((doc: any) => doc.id);
      const friendProfiles: UserProfile[] = [];

      for (const friendId of friendIds) {
        const friendDoc = await getDoc(firestoreDoc(db, 'userProfiles', friendId));
        if (friendDoc.exists()) {
          const friendData = convertTimestamps(friendDoc.data());
          
          // Fetch last message
          const chatQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          
          const chatSnapshot = await getDocs(chatQuery);
          const lastMessage = chatSnapshot.docs
            .find(doc => {
              const data = doc.data();
              return data.participants.includes(friendId);
            })
            ?.data();
          
          const friendProfile: UserProfile = {
            id: friendId,
            username: friendData.username || 'unknown',
            displayName: friendData.displayName || 'Unknown User',
            email: friendData.email || '',
            photoURL: friendData.photoURL || friendData.avatarUrl || null,
            avatarUrl: friendData.photoURL || friendData.avatarUrl || null,
            status: friendData.status || 'offline',
            createdAt: friendData.createdAt || new Date(),
            lastSeen: friendData.lastSeen || new Date(),
            lastOnline: friendData.lastOnline || new Date(),
            searchTerms: friendData.searchTerms || [],
            lastMessage: lastMessage ? {
              text: lastMessage.content,
              timestamp: lastMessage.createdAt.toDate()
            } : undefined
          };
          
          if (isMounted()) {
            friendProfiles.push(friendProfile);
          }
        }
      }

      if (isMounted()) {
        setFriends(friendProfiles);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error handling friends snapshot:', err);
      if (isMounted()) {
        setError('Failed to load friends');
        setLoading(false);
      }
    }
  };

  // Subscribe to activity feed
  useEffect(() => {
    if (!user || friends.length === 0) {
      setActivityFeed([]);
      return;
    }

    console.log('Setting up activity feed subscription for user:', user.uid);
    console.log('Including activities for friends:', friends.map(f => f.id));

    const userIds = [user.uid, ...friends.map(f => f.id)];
    const activityQuery = query(
      collection(db, 'activity'),
      where('visibleTo', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeActivity = onSnapshot(
      activityQuery,
      async (snapshot) => {
        try {
          console.log('Received activity snapshot with size:', snapshot.size);
          const activities: ActivityItem[] = [];
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log('Processing activity:', doc.id, data);
            
            try {
              activities.push(convertTimestamps({ 
                id: doc.id, 
                ...data 
              }) as ActivityItem);
            } catch (error) {
              console.error('Error processing activity item:', doc.id, error);
            }
          }
          
          console.log('Setting activity feed with items:', activities.length);
          setActivityFeed(activities);
        } catch (error) {
          console.error('Error processing activity snapshot:', error);
          setError('Failed to process activity feed data');
        }
      },
      (error) => {
        console.error('Error fetching activity:', error);
        setError('Failed to load activity feed');
      }
    );

    return () => {
      console.log('Cleaning up activity feed subscription');
      unsubscribeActivity();
    };
  }, [user, friends]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return false;

    try {
      setError(null);
      
      // Check if request already exists
      const existingQuery = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid),
        where('receiverId', '==', receiverId),
        where('status', '==', 'pending')
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        console.log('Friend request already exists');
        return false;
      }

      // Create the friend request
      const request = {
        senderId: user.uid,
        receiverId: receiverId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating friend request:', request);
      await addDoc(collection(db, 'friendRequests'), request);
      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request');
      return false;
    }
  };

  // Accept friend request
  const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined' | 'cancelled') => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      const requestRef = firestoreDoc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) throw new Error('Request not found');
      
      const request = requestDoc.data() as FriendRequest;
      
      // Verify user is authorized to respond
      if (response === 'cancelled' && request.senderId !== user.uid) {
        throw new Error('Not authorized to cancel request');
      }
      if ((response === 'accepted' || response === 'declined') && request.receiverId !== user.uid) {
        throw new Error('Not authorized to respond to request');
      }
      
      // Update request status
      batch.update(requestRef, {
        status: response,
        updatedAt: serverTimestamp()
      });
      
      // If accepted, add to friends collections
      if (response === 'accepted') {
        const senderFriendsRef = firestoreDoc(db, `userProfiles/${request.senderId}/friends/${user.uid}`);
        const receiverFriendsRef = firestoreDoc(db, `userProfiles/${request.receiverId}/friends/${request.senderId}`);
        
        batch.set(senderFriendsRef, {
          createdAt: serverTimestamp()
        });
        
        batch.set(receiverFriendsRef, {
          createdAt: serverTimestamp()
        });
      }
      
      await batch.commit();
    } catch (err) {
      console.error('Error responding to friend request:', err);
      setError('Failed to respond to friend request');
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      
      // Remove from both users' friends collections
      const userFriendRef = firestoreDoc(db, `userProfiles/${user.uid}/friends/${friendId}`);
      const friendUserRef = firestoreDoc(db, `userProfiles/${friendId}/friends/${user.uid}`);
      
      batch.delete(userFriendRef);
      batch.delete(friendUserRef);
      
      await batch.commit();
    } catch (err) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend');
    }
  };

  return {
    friends,
    friendRequests,
    activityFeed,
    loading,
    error,
    sendFriendRequest,
    respondToFriendRequest,
    searchUsers,
    removeFriend
  };
}
