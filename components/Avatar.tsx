'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import type { UserProfile } from '@/types/social';
import { cn } from '@/lib/utils';

interface BasicUser {
  id: string;
  displayName: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
}

interface AvatarProps {
  user: User | UserProfile | BasicUser | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: {
    dimensions: 'h-8 w-8',
    textSize: 'text-sm',
    pixels: 32
  },
  md: {
    dimensions: 'h-10 w-10',
    textSize: 'text-base',
    pixels: 40
  },
  lg: {
    dimensions: 'h-12 w-12',
    textSize: 'text-lg',
    pixels: 48
  },
};

export default function Avatar({ user, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { dimensions, textSize, pixels } = sizeMap[size];

  const getInitials = () => {
    if (!user) return '?';

    if ('uid' in user) {
      return user.displayName
        ? user.displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0].toUpperCase() || '?';
    }
    
    return user.displayName
      ? user.displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';
  };

  const getBackgroundColor = () => {
    if (!user) return 'bg-gray-400';

    const id = 'uid' in user ? user.uid : user.id;
    const colors = [
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
    ];

    const index = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getPhotoURL = () => {
    if (!user) {
      console.log('Avatar: No user provided');
      return null;
    }
    
    // Firebase User
    if ('uid' in user) {
      console.log('Avatar: Firebase User photo URL:', user.photoURL);
      return user.photoURL;
    }
    
    // Use type guard to access avatarUrl property only on objects that have it
    const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : null;
    const url = user.photoURL || avatarUrl;
    
    console.log('Avatar: UserProfile/BasicUser photo URL:', {
      photoURL: user.photoURL,
      avatarUrl: avatarUrl,
      selected: url
    });
    return url;
  };

  const photoURL = getPhotoURL();

  if (user && photoURL && !imageError) {
    return (
      <div className={cn(`relative ${dimensions} overflow-hidden rounded-full`, className)}>
        <Image
          src={photoURL}
          alt={getInitials()}
          width={pixels}
          height={pixels}
          style={{ width: '100%', height: '100%' }}
          className="object-cover"
          onError={(e) => {
            console.error('Failed to load avatar image:', {
              url: photoURL,
              error: e,
              user: {
                id: 'uid' in user ? user.uid : user.id,
                photoURL: user.photoURL,
                avatarUrl: 'avatarUrl' in user ? user.avatarUrl : undefined
              }
            });
            setImageError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(`flex ${dimensions} items-center justify-center rounded-full ${getBackgroundColor()} text-white`, className)}
    >
      <span className={textSize}>{getInitials()}</span>
    </div>
  );
}
