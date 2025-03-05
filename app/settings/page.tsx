/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuthContext } from '@/components/AuthProvider';
import { useSettings } from '@/hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import BackButton from '@/components/BackButton';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const { settings, loading, error: settingsError, updateTheme, toggleEmailNotifications } = useSettings();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    console.log('Settings page - Auth state:', { 
      isAuthenticated: !!user,
      uid: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      metadata: user?.metadata,
    });
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg bg-background-lighter p-6 text-foreground-muted">
          Please sign in to view settings
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg bg-background-lighter p-6 text-foreground-muted">
          Loading settings...
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg bg-background-lighter p-6 text-red-500">
          {settingsError}
        </div>
      </div>
    );
  }

  const handleThemeChange = async (theme: 'dark' | 'light' | 'system') => {
    await updateTheme(theme);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!user?.email) {
      setPasswordError('No user email found');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      // re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Then update the password
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to update password. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      {/* Appearance Settings */}
      <div className="mb-8 space-y-6">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <div className="rounded-lg border border-background-lighter bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-sm text-foreground-muted">
                Choose your preferred theme
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={settings?.theme}
                onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light' | 'system')}
                className="rounded-md border border-background-lighter bg-background px-3 py-2 text-sm text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8 space-y-6">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="rounded-lg border border-background-lighter bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-foreground-muted">
                Receive email updates about new games and features
              </p>
            </div>
            <Switch
              checked={settings?.emailNotifications ?? false}
              onCheckedChange={toggleEmailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Security</h2>
        <div className="rounded-lg border border-background-lighter bg-background p-4">
          <div className="mb-8 space-y-6">
            <h2 className="text-xl font-semibold">Change Password</h2>
            <div className="rounded-lg border border-background-lighter bg-background p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-foreground">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-foreground">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                    required
                  />
                </div>
                {passwordError && (
                  <div className="text-sm text-error">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="text-sm text-primary-dark">Password updated successfully!</div>
                )}
                <button
                  type="submit"
                  className="rounded-md bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
