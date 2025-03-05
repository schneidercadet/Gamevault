'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import GameCard from '@/components/GameCard';
import GameCardSkeleton from '@/components/GameCardSkeleton';
import { Game } from '@/types/game';
import { getPopularGames, getTrendingGames } from '@/lib/api';
import Footer from '@/components/Footer';

export default function GamesPage() {
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        
        // Fetch games sequentially to avoid overwhelming the API
        const popular = await getPopularGames().catch(error => {
          console.error('Error fetching popular games:', error);
          return [];
        });
        
        const trending = await getTrendingGames().catch(error => {
          console.error('Error fetching trending games:', error);
          return [];
        });

        setPopularGames(popular);
        setTrendingGames(trending);
      } catch (error) {
        console.error('Error in fetchGames:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const skeletons = Array.from({ length: 8 }).map((_, i) => (
    <GameCardSkeleton key={i} />
  ));

  if (isLoading) {
    return (
      <>
        <Suspense fallback={<div className="h-16 bg-background"></div>}>
          <Navbar />
        </Suspense>
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-12 text-center">
              <h1 className="mb-2 text-3xl font-bold text-foreground">
                Discover Games
              </h1>
              <p className="text-foreground-muted">
                Explore the latest and greatest games across all platforms
              </p>
            </div>

            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Popular Games
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {skeletons}
              </div>
            </section>

            <section>
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Trending Now
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {skeletons}
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  const hasGames = popularGames.length > 0 || trendingGames.length > 0;

  if (!hasGames) {
    return (
      <>
        <Suspense fallback={<div className="h-16 bg-background"></div>}>
          <Navbar />
        </Suspense>
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-xl font-semibold text-foreground">No games available</h2>
              <p className="text-foreground-muted">
                We&apos;re having trouble loading the games. Please try again later.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<div className="h-16 bg-background"></div>}>
        <Navbar />
      </Suspense>
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Discover Games
            </h1>
            <p className="text-foreground-muted">
              Explore the latest and greatest games across all platforms
            </p>
          </div>

          {popularGames.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Popular Games
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popularGames.map((game, index) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    priority={index < 6}
                  />
                ))}
              </div>
            </section>
          )}

          {trendingGames.length > 0 && (
            <>
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-semibold text-foreground">
                  Trending Now
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {trendingGames.map((game, index) => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      priority={index < 6}
                    />
                  ))}
                </div>
              </section>
              <Footer />
            </>
          )}
        </div>
      </main>
    </>
  );
}
