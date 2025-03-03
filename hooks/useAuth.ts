import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  query, 
  collection, 
  where, 
  limit, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified
      });

      if (user) {
        try {
          // Force token refresh on auth state change
          await user.getIdToken(true);
          setUser(user);
        } catch (err) {
          console.error('Error refreshing token:', err);
          setError('Authentication error');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user profile
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const userProfileDoc = await getDoc(userProfileRef);

      const profileData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        username: user.email?.split('@')[0] || 'user',
        photoURL: user.photoURL,
        avatarUrl: user.photoURL,
        status: 'online' as const,
        lastSeen: serverTimestamp(),
        searchTerms: [
          user.displayName?.toLowerCase() || '',
          user.email?.toLowerCase() || '',
        ].filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (!userProfileDoc.exists()) {
        // New user - create profile
        await setDoc(userProfileRef, {
          ...profileData,
          createdAt: serverTimestamp(),
        });
      } else {
        // Existing user - update only necessary fields
        await updateDoc(userProfileRef, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
          avatarUrl: profileData.avatarUrl,
          lastSeen: profileData.lastSeen,
          searchTerms: profileData.searchTerms,
          updatedAt: profileData.updatedAt,
        });
      }

      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup - this is not a real error
        setError(null);
      } else if (error.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Multiple popups were opened - not a real error
        setError(null);
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GithubAuthProvider();
      
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await handleUserProfile(user);
      } catch (error) {
        if (error.code === 'auth/account-exists-with-different-credential') {
          // Get sign-in methods for the email
          const email = error.customData?.email;
          const methods = await fetchSignInMethodsForEmail(auth, email);
          
          if (methods?.includes('google.com')) {
            setError(`This email is already registered with Google. Please sign in with Google instead.`);
          } else if (methods?.includes('password')) {
            setError(`This email is already registered. Please sign in with email and password.`);
          } else {
            setError(`This email is already registered with a different provider. Please use that to sign in.`);
          }
        } else if (error.code === 'auth/popup-closed-by-user') {
          // User closed the popup - this is not a real error
          setError(null);
        } else if (error.code === 'auth/popup-blocked') {
          setError('The sign-in popup was blocked. Please allow popups for this site.');
        } else if (error.code === 'auth/cancelled-popup-request') {
          // Multiple popups were opened - not a real error
          setError(null);
        } else if (error.code === 'auth/network-request-failed') {
          setError('Network error. Please check your internet connection.');
        } else {
          console.error('GitHub sign in error:', error);
          setError('Failed to sign in with GitHub. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in GitHub sign in:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle user profile creation/update
  const handleUserProfile = async (user: User) => {
    try {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const userProfileDoc = await getDoc(userProfileRef);

      const profileData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        username: user.email?.split('@')[0] || 'user',
        photoURL: user.photoURL,
        avatarUrl: user.photoURL,
        status: 'online' as const,
        lastSeen: serverTimestamp(),
        searchTerms: [
          user.displayName?.toLowerCase() || '',
          user.email?.toLowerCase() || '',
        ].filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (!userProfileDoc.exists()) {
        // New user - create profile
        await setDoc(userProfileRef, {
          ...profileData,
          createdAt: serverTimestamp(),
        });
      } else {
        // Existing user - update only necessary fields
        await updateDoc(userProfileRef, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
          avatarUrl: profileData.avatarUrl,
          lastSeen: profileData.lastSeen,
          searchTerms: profileData.searchTerms,
          updatedAt: profileData.updatedAt,
        });
      }

      setUser(user);
    } catch (error) {
      console.error('Error handling user profile:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if username is available
      const usernameQuery = query(
        collection(db, 'userProfiles'),
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already taken');
      }

      // Create user profile
      const userProfile: UserProfile = {
        id: user.uid,
        username: username.toLowerCase(),
        displayName: username,
        email: user.email!,
        avatarUrl: user.photoURL,
        status: 'online',
        createdAt: new Date(),
        lastSeen: new Date(),
        lastOnline: new Date(),
        searchTerms: [username.toLowerCase(), user.email!.toLowerCase()],
      };

      await setDoc(doc(db, 'userProfiles', user.uid), userProfile);
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
