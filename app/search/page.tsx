import { getGames } from '@/lib/api';
import GameCard from '@/components/GameCard';
import Navbar from '@/components/Navbar';
import { Metadata } from 'next';

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  return {
    title: `Search: ${resolvedParams.q || ''} - GameVault`,
    description: `Search results for "${resolvedParams.q}" on GameVault`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const data = await getGames({ search: query });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Search Results for &quot;{query}&quot;
            </h1>
            <p className="mt-2 text-gray-400">
              Found {data.count} {data.count === 1 ? 'game' : 'games'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.results.map((game, index) => (
              <GameCard 
                key={game.id} 
                game={game} 
                priority={index < 6} // First 6 search results will have priority loading
              />
            ))}
          </div>

          {data.results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <i className="fas fa-search mb-4 text-4xl text-gray-600" />
              <h2 className="mb-2 text-xl font-bold text-white">
                No games found
              </h2>
              <p className="text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
