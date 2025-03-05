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
import { auth, db } from '@/lib/firebase/firebase';
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
      
      // Type guard to check if error is an object with a code property
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        
        if (firebaseError.code === 'auth/popup-closed-by-user') {
          // User closed the popup - this is not a real error
          setError(null);
        } else if (firebaseError.code === 'auth/popup-blocked') {
          setError('The sign-in popup was blocked. Please allow popups for this site.');
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          // Multiple popups were opened - not a real error
          setError(null);
        } else if (firebaseError.code === 'auth/network-request-failed') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError('Failed to sign in with Google. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
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
        return true;
      } catch (error) {
        console.error('Error in signInWithGithub:', error);
        
        // Type guard for error
        if (error && typeof error === 'object' && 'code' in error) {
          const firebaseError = error as { code: string };
          if (firebaseError.code === 'auth/popup-closed-by-user') {
            // User closed the popup - this is not a real error
            setError(null);
          } else {
            setError('Failed to sign in with GitHub. Please try again.');
          }
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error in GitHub sign in:', error);
        
        // Type guard for error
        if (error && typeof error === 'object' && 'code' in error) {
          const firebaseError = error as { code: string };
          if (firebaseError.code === 'auth/account-exists-with-different-credential') {
            // Get sign-in methods for the email
            let email = '';
            
            // Safe access to email property in customData
            if ('customData' in firebaseError && 
                typeof firebaseError.customData === 'object' && 
                firebaseError.customData && 
                'email' in firebaseError.customData && 
                typeof firebaseError.customData.email === 'string') {
              email = firebaseError.customData.email;
            }
              
            if (email) {
              const methods = await fetchSignInMethodsForEmail(auth, email);
              
              if (methods?.includes('google.com')) {
                setError(`This email is already registered with Google. Please sign in with Google instead.`);
              } else if (methods?.includes('password')) {
                setError(`This email is already registered. Please sign in with email and password.`);
              } else {
                setError(`This email is already registered with a different provider. Please use that to sign in.`);
              }
            } else {
              setError('This email is already registered with a different provider.');
            }
          } else {
            setError('Failed to sign in with GitHub. Please try again.');
          }
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        
        setLoading(false);
        return false;
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
        userId: user.uid,
        username: username.toLowerCase(),
        displayName: username,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: new Date()
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
