'use client';
import SplineScene from './SplineScene';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Loading from './Loading';

export default function HeroSection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  return (
    <div>
      {isLoading && <Loading />}
      <div className="absolute inset-0">
        <SplineScene />
      </div>
      <section className="relative min-h-[80vh] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0" />
        </div>
        
        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center mt-[50px] px-4 text-center sm:px-6 lg:px-8">
          <div className="backdrop-blur-md bg-background/30 border border-background-lighter/50 rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Your Gaming Collection,
              <span className="text-primary-dark"> Reimagined</span>
            </h1>
            <p className="mx-auto mt-10 max-w-2xl text-base text-foreground-muted sm:text-lg md:text-xl">
              Track, discover, and organize your video game collection with ease.
              Get personalized recommendations and connect with fellow gamers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => handleNavigation('/games')}
                className="pointer-events-auto w-full rounded-lg bg-primary-dark/90 backdrop-blur-sm px-8 py-3 text-base font-semibold text-foreground transition-all hover:scale-105 hover:bg-primary-dark hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-opacity-50 sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
              >
                Browse Games
              </button>
              <button
                onClick={() => handleNavigation('/about')}
                className="pointer-events-auto w-full rounded-lg border-2 border-primary-dark/50 backdrop-blur-sm px-8 py-3 text-base font-semibold text-foreground transition-all hover:scale-105 hover:bg-primary-dark/20 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-opacity-50 sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
