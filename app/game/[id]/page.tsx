import { getGameDetails } from "@/lib/api";
import { Metadata } from "next";
import Image from "next/image";
import { Carousel } from "@/components/ui/carousel";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import GameActions from "@/components/GameActions";
import Footer from "@/components/Footer";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const game = await getGameDetails(id);
  return {
    title: `${game.title} - GameVault`,
    description: game.description?.slice(0, 160),
  };
}

export default async function GamePage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  if (!id) {
    throw new Error("Game ID is required");
  }

  const game = await getGameDetails(id);

  if (!game || !game.id) {
    console.error("Invalid game data:", { id, game });
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Game Not Found
          </h1>
          <p className="mb-4 text-foreground-muted">
            The game you&rsquo;re looking for could not be found.
          </p>
          <Link href="/games" className="text-purple-400 hover:text-purple-300">
            Return to Games
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="relative h-[50vh] w-full">
          <div className="absolute left-4 top-4 z-10">
            <BackButton />
          </div>
          <Image
            src={game.coverUrl || "/placeholder.jpg"}
            alt={game.title}
            fill
            className="object-cover brightness-50"
            sizes="100vw"
            priority={true}
            loading="eager"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              {game.title}
            </h1>
            <div className="flex flex-wrap gap-4">
              {game.platforms.map(({ platform }, index) => (
                <span
                  key={index}
                  className="rounded-full border border-primary-dark/10 bg-gradient-to-b from-background to-background-lighter px-4 py-2 text-sm text-foreground-muted"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-foreground">About</h2>
                <p className="text-foreground-muted">{game.description}</p>
              </div>

              {game.screenshots && (
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-bold text-foreground">
                    Screenshots
                  </h2>
                  <Carousel images={game.screenshots} />
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="rounded-lg border border-primary-dark/10 bg-gradient-to-b from-background to-background-lighter p-6">
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  {game.metacritic && (
                    <div>
                      <dt className="text-sm text-foreground-muted">
                        Metacritic
                      </dt>
                      <dd className="text-lg font-bold text-foreground">
                        {game.metacritic}
                      </dd>
                    </div>
                  )}
                  {game.released && (
                    <div>
                      <dt className="text-sm text-foreground-muted">
                        Release Date
                      </dt>
                      <dd className="text-lg font-bold text-foreground">
                        {new Date(game.released).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {game.developers.length > 0 && (
                    <div>
                      <dt className="text-sm text-foreground-muted">Developer</dt>
                      <dd className="text-lg font-bold text-foreground">
                        {game.developers.join(", ")}
                      </dd>
                    </div>
                  )}
                  {game.publishers.length > 0 && (
                    <div>
                      <dt className="text-sm text-foreground-muted">Publisher</dt>
                      <dd className="text-lg font-bold text-foreground">
                        {game.publishers.join(", ")}
                      </dd>
                    </div>
                  )}
                  {game.genres.length > 0 && (
                    <div>
                      <dt className="text-sm text-foreground-muted">Genres</dt>
                      <dd className="flex flex-wrap gap-2">
                        {game.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-purple-500/10 px-3 py-1 text-sm text-purple-400"
                          >
                            {genre}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
                {game.website && (
                  <a
                    href={game.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 block rounded-lg bg-purple-600 px-6 py-3 text-center font-bold text-white transition-all hover:bg-purple-700"
                  >
                    Visit Website
                  </a>
                )}
                <GameActions 
                  game={{
                    ...game,
                    platform: game.platforms?.[0]?.platform || "Unknown",
                    genre: game.genres?.[0] || "Unknown"
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
