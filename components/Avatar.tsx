'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';

interface BasicUser {
  id: string;
  displayName: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  photoURL?: string | null;
  avatarUrl?: string | null;
  email?: string;
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

  // Get initials from display name or email
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
    
    // UserProfile or BasicUser
    return user.displayName
      ? user.displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';
  };

  // Get random background color
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

  // Get photo URL from either Firebase User or UserProfile
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
    
    // UserProfile or BasicUser - try both fields
    const url = user.photoURL || user.avatarUrl;
    console.log('Avatar: UserProfile/BasicUser photo URL:', {
      photoURL: user.photoURL,
      avatarUrl: user.avatarUrl,
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
