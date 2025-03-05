'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CarouselProps {
  images: string[];
  className?: string;
}

export function Carousel({ images, className }: CarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, [images.length, isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrent((current + 1) % images.length);
  };

  const previous = () => {
    setIsAutoPlaying(false);
    setCurrent((current - 1 + images.length) % images.length);
  };

  if (!images?.length) return null;

  return (
    <Card
      className={cn(
        'w-full overflow-hidden rounded-xl border-0 bg-transparent shadow-2xl',
        className
      )}
    >
      <CardContent className="relative aspect-video p-0">
        <div className="group relative h-full w-full">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={cn(
                'absolute h-full w-full transform transition-all duration-700 ease-in-out',
                index === current
                  ? 'scale-100 opacity-100'
                  : 'scale-105 opacity-0'
              )}
            >
              <Image
                src={image}
                alt={`Screenshot ${index + 1}`}
                fill
                className="object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ))}

          {/* Navigation buttons */}
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <Button
              variant="default"
              size="sm"
              className="hidden h-11 w-11 rounded-full bg-transparent text-white transition-all hover:bg-purple-700 hover:shadow-xl md:flex md:items-center md:justify-center"
              onClick={previous}
            >
              <i className="fas fa-chevron-left text-lg" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="hidden h-11 w-11 rounded-full bg-transparent text-white transition-all hover:bg-purple-700 hover:shadow-xl md:flex md:items-center md:justify-center"
              onClick={next}
            >
              <i className="fas fa-chevron-right text-lg" />
            </Button>
          </div>

          {/* Navigation dots */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrent(index);
                }}
                className={cn(
                  'h-1.5 rounded-full backdrop-blur-sm transition-all duration-300',
                  index === current
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
