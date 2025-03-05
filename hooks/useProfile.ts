/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  collection, 
  where, 
  getDocs, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  updateProfile as updateFirebaseProfile, 
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase/firebase';
import { UserProfile } from '@/types';
import { useAuthContext } from '@/components/AuthProvider';

export function useProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    let unsubscribed = false;

    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setError(null);
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (unsubscribed) return;

        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as UserProfile;
          setProfile(profileData);
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile: UserProfile = {
            userId: user.uid,
            username: user.email ? user.email.split('@')[0].toLowerCase() : `user${Date.now()}`,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            email: user.email || '',
            bio: '',
            updatedAt: new Date()
          };

          if (!unsubscribed) {
            await setDoc(profileRef, defaultProfile);
            setProfile(defaultProfile);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (!unsubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        }
      } finally {
        if (!unsubscribed) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      unsubscribed = true;
    };
  }, [user?.uid]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);
      const profileRef = doc(db, 'userProfiles', user.uid);
      
      const updatedProfile = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(profileRef, updatedProfile);

      // Update Firebase Auth profile if display name is updated
      if (updates.displayName) {
        await updateFirebaseProfile(auth.currentUser!, {
          displayName: updates.displayName
        });
      }

      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update both Firebase Auth and Firestore profile
      await Promise.all([
        updateFirebaseProfile(auth.currentUser!, { photoURL }),
        updateProfile({ photoURL })
      ]);

      return true;
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
      return false;
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return false;
    
    try {
      setError(null);
      
      // Check if username is available
      const usernameQuery = query(
        collection(db, 'userProfiles'),
        where('username', '==', newUsername.toLowerCase()),
        limit(1)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty && usernameSnapshot.docs[0].id !== user.uid) {
        setError('Username already taken');
        return false;
      }

      const profileRef = doc(db, 'userProfiles', user.uid);
      const updates = {
        username: newUsername.toLowerCase(),
        searchTerms: [newUsername.toLowerCase(), user.email!.toLowerCase()],
        updatedAt: new Date()
      };

      console.log('Updating profile with:', updates); // Debug log
      await updateDoc(profileRef, updates);

      // Get the latest profile data
      const updatedDoc = await getDoc(profileRef);
      const updatedProfile = updatedDoc.data() as UserProfile;
      console.log('Updated profile:', updatedProfile); // Debug log

      // Update local state with full profile data
      setProfile(prev => ({
        ...prev!,
        ...updates
      }));

      return true;
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username');
      return false;
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user) return false;
    
    try {
      setError(null);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Delete profile picture from storage if exists
      if (profile?.photoURL) {
        const imageRef = ref(storage, `profilePictures/${user.uid}`);
        await deleteObject(imageRef);
      }

      // Delete user profile from Firestore
      await deleteDoc(doc(db, 'userProfiles', user.uid));

      // Delete Firebase user
      await deleteUser(user);
      
      return true;
    } catch (err: any) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError('Failed to delete account');
      }
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    updateUsername,
    deleteAccount
  };
}
