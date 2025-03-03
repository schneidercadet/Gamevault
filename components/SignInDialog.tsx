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
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useAuthContext } from './AuthProvider';
import { useRouter } from 'next/navigation';
import SignUpDialog from './SignUpDialog';
import { Input } from './ui/input';

export default function SignInDialog() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { signInWithEmail, signInWithGoogle, signInWithGithub } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      setIsOpen(false);
      router.push('/games');
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again or create a new account.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in');
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
      setIsOpen(false);
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
      setIsOpen(false);
      router.push('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Github');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowSignUp(false);
      setError('');
      setEmail('');
      setPassword('');
    }
  };

  if (showSignUp) {
    return (
      <SignUpDialog 
        isOpen={isOpen} 
        onClose={() => setShowSignUp(false)} 
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="relative whitespace-nowrap text-foreground-muted transition-colors duration-300 before:absolute before:-bottom-1 before:left-0 before:h-0.5 before:w-0 before:bg-primary-dark before:transition-all before:duration-300 hover:text-foreground hover:before:w-full">
          Sign In
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to GameVault</DialogTitle>
          <DialogDescription>
            Enter your email below to sign in to your account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground-muted"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center text-sm">
            <span className="text-foreground-muted">Don&rsquo;t have an account? </span>
            <button
              type="button"
              onClick={() => setShowSignUp(true)}
              className="font-semibold text-primary-dark hover:text-primary-dark/90"
            >
              Sign up
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
