'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let x = rect.left + scrollX;
    let y = rect.top + scrollY;

    switch (side) {
      case 'top':
        x += rect.width / 2;
        y -= 10;
        break;
      case 'right':
        x += rect.width + 10;
        y += rect.height / 2;
        break;
      case 'bottom':
        x += rect.width / 2;
        y += rect.height + 10;
        break;
      case 'left':
        x -= 10;
        y += rect.height / 2;
        break;
    }

    setPosition({ x, y });
  }, [side]);

  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 rounded-md border border-background-lighter bg-background px-3 py-1.5 text-sm text-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95',
            {
              '-translate-x-1/2 -translate-y-full': side === 'top',
              'translate-y-1/2': side === 'right',
              '-translate-x-1/2': side === 'bottom',
              '-translate-x-full translate-y-1/2': side === 'left',
            },
            className
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => children;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => children;
export const TooltipContent = ({ children }: { children: React.ReactNode }) => children;
