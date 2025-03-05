'use client';

import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function SignIn() {
  const { signInWithGoogle, signInWithGithub, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setError(null);
      await signInWithGithub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with GitHub');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Sign in to GameVault
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} />
            Continue with Google
          </button>

          <button
            onClick={handleGithubSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#24292F] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#24292F]/90"
          >
            <Image src="/github.svg" alt="GitHub" width={20} height={20} />
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
