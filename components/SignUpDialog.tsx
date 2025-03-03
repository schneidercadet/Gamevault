/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useAuthContext } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function SignUpDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, signInWithGoogle, signInWithGithub } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password, username);
      onClose();
      router.push('/games');
    } catch (err: any) {
      if (err?.message === 'Username already taken') {
        setError('This username is already taken. Please choose another one.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      onClose();
      router.push('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGithub();
      onClose();
      router.push('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Github');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Enter your details below to create your account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground-muted"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-sm placeholder-foreground-muted focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-sm placeholder-foreground-muted focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground-muted"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-background-lighter bg-background px-3 py-2 text-sm placeholder-foreground-muted focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="text-center text-sm">
              <span className="text-foreground-muted">Already have an account? </span>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-primary-dark hover:text-primary-dark/90"
              >
                Sign in
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-background-lighter"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-foreground-muted">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-md border border-background-lighter bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-lighter focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 disabled:opacity-50"
              >
                <Image
                  src="/assets/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                Google
              </button>
              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-md border border-background-lighter bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-lighter focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 disabled:opacity-50"
              >
                <Image
                  src="/assets/github.svg"
                  alt="GitHub"
                  width={20}
                  height={20}
                />
                GitHub
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
