"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { UserSettings } from '@/types';
import { useAuthContext } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';

export function useSettings() {
  const { user } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      if (!user?.uid) {
        console.log('No user UID available, skipping settings fetch');
        setError('Please sign in to view settings');
        setLoading(false);
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        console.log('Auth state:', {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          emailVerified: user.emailVerified
        });

        const token = await user.getIdToken(true);
        console.log('Token refreshed successfully');

        const userSettingsRef = doc(db, 'userSettings', user.uid);
        console.log('Attempting to fetch settings for user:', user.uid);

        const settingsDoc = await getDoc(userSettingsRef);
        console.log('Settings doc fetch result:', {
          exists: settingsDoc.exists(),
          fromCache: settingsDoc.metadata.fromCache
        });

        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as UserSettings;
          if (isMounted) {
            setSettings(data);
            setTheme(data.theme);
            setError(null);
          }
        } else {
          console.log('Creating default settings...');
          const defaultSettings: UserSettings = {
            userId: user.uid,
            darkMode: true,
            emailNotifications: true,
            theme: 'dark',
            updatedAt: new Date(),
          };

          try {
            await setDoc(userSettingsRef, defaultSettings);
            if (isMounted) {
              setSettings(defaultSettings);
              setTheme(defaultSettings.theme);
              setError(null);
            }
          } catch (err) {
            console.error('Failed to create default settings:', err);
            setError('Failed to create settings');
          }
        }
      } catch (err: any) {
        console.error('Settings fetch error details:', {
          code: err.code,
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        if (err?.code === 'permission-denied') {
          setError('Please try signing out and back in');
        } else {
          setError('Failed to fetch settings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, setTheme]);

  const updateTheme = async (newTheme: 'dark' | 'light' | 'system') => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, `userSettings/${user.uid}`);
      await setDoc(settingsRef, { theme: newTheme, updatedAt: new Date() }, { merge: true });
      setTheme(newTheme);
      setError(null);
    } catch (err) {
      console.error('Failed to update theme:', err);
      setError('Failed to update theme');
    }
  };

  const toggleEmailNotifications = async (enabled: boolean) => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, `userSettings/${user.uid}`);
      await setDoc(settingsRef, { emailNotifications: enabled, updatedAt: new Date() }, { merge: true });
      setSettings(prev => prev ? { ...prev, emailNotifications: enabled } : null);
      setError(null);
    } catch (err) {
      console.error('Failed to update email notifications:', err);
      setError('Failed to update email notifications');
    }
  };

  return { settings, loading, error, updateTheme, toggleEmailNotifications };
}