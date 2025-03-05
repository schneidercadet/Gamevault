'use client';

import { useAuthContext } from './AuthProvider';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SignInDialog from './SignInDialog';
import Avatar from './Avatar';

export default function UserMenu() {
  const { user, signOut } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return <SignInDialog />;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-full hover:opacity-80"
      >
        <Avatar user={user} size="lg" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-input py-2 shadow-xl">
          <div className="border-b border-background-lighter px-4 pb-2">
            <p className="font-medium text-foreground">
              {user.displayName || user.email}
            </p>
            {user.displayName && (
              <p className="text-sm text-foreground-muted">{user.email}</p>
            )}
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-foreground hover:bg-background-lighter"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/collections"
            className="block px-4 py-2 text-sm text-foreground hover:bg-background-lighter"
            onClick={() => setIsOpen(false)}
          >
            My Collections
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-foreground hover:bg-background-lighter"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-background-lighter"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}