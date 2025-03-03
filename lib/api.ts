import { Game, GameDetails } from '@/types/game';

const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_RAWG_BASE_URL || 'https://api.rawg.io/api',
  API_KEY: process.env.NEXT_PUBLIC_RAWG_API_KEY,
  DEFAULT_PAGE_SIZE: 20,
  RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

interface GamesResponse {
  results: Game[];
  count: number;
}

interface GetGamesParams {
  page?: number;
  search?: string;
  pageSize?: number;
  ordering?: string;
  metacritic?: string;
  dates?: string;
  platforms?: string;
}

interface RawGamePlatform {
  platform: {
    name: string;
  };
  released_at?: string | null;
  requirements?: {
    minimum?: string;
    recommended?: string;
  };
}

interface RawGameStore {
  store: {
    name: string;
  };
  url: string;
}

interface RawGameDeveloper {
  name: string;
}

interface RawGamePublisher {
  name: string;
}

interface RawGameGenre {
  name: string;
}

interface RawGameTag {
  name: string;
}

interface RawGameRating {
  id: number;
  title: string;
  count: number;
  percent: number;
}

interface RawGameResponse {
  id: number;
  name: string;
  background_image: string | null;
  background_image_additional?: string | null;
  platforms?: RawGamePlatform[];
  genres?: RawGameGenre[];
  rating: number;
  released: string | null;
  metacritic: number | null;
  ratings_count: number | null;
  reviews_count: number | null;
  suggestions_count: number | null;
  esrb_rating?: {
    name: string;
  } | null;
  description_raw?: string;
  description?: string;
  website?: string | null;
  metacritic_url?: string | null;
  tba?: boolean;
  ratings?: RawGameRating[];
  stores?: RawGameStore[];
  developers?: RawGameDeveloper[];
  publishers?: RawGamePublisher[];
  tags?: RawGameTag[];
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = API_CONFIG.RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export function getLastYearDateRange() {
  const today = new Date();
  const lastYear = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  );
  return `${lastYear.toISOString().split('T')[0]},${
    today.toISOString().split('T')[0]
  }`;
}

export function getLastTenYearsDateRange(): string {
  const today = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);
  return `${tenYearsAgo.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
}

export function calculateRating(game: RawGameResponse): number {
  if (game.metacritic) {
    return game.metacritic / 10;
  } else if (game.rating && game.ratings_count && game.ratings_count > 10) {
    return game.rating;
  }
  return 0;
}

export function getLastMonthDate() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return `${lastMonth.toISOString().split('T')[0]},${
    today.toISOString().split('T')[0]
  }`;
}

export async function getGames({
  page = 1,
  search = '',
  pageSize = API_CONFIG.DEFAULT_PAGE_SIZE,
  ordering = '-metacritic',
  metacritic = '',
  dates = getLastTenYearsDateRange(),
  platforms = '',
}: GetGamesParams = {}): Promise<GamesResponse> {
  if (!API_CONFIG.API_KEY) {
    throw new Error('API key is not configured');
  }

  const params = new URLSearchParams();
  params.append('key', API_CONFIG.API_KEY);
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());

  if (search) params.append('search', search);
  if (ordering) params.append('ordering', ordering);
  if (metacritic) params.append('metacritic', metacritic);
  if (dates) params.append('dates', dates);
  if (platforms) params.append('platforms', platforms);

  try {
    const response = await fetchWithRetry(
      `${API_CONFIG.BASE_URL}/games?${params.toString()}`
    );

    const data = await response.json();
    
    // Transform the API response to match our Game interface
    const transformedResults = data.results
      .filter((game: RawGameResponse) => game.background_image) // Filter out games without images
      .map((game: RawGameResponse) => {
        const platforms = game.platforms?.map((p: RawGamePlatform) => p.platform.name) || [];
        const genres = game.genres?.map((g: RawGameGenre) => g.name) || [];
        
        return {
          id: game.id.toString(),
          title: game.name,
          coverUrl: game.background_image,
          platform: platforms.join(', '),
          genre: genres.join(', '),
          rating: calculateRating(game),
          releaseDate: game.released,
          metacritic: game.metacritic,
          ratingCount: game.ratings_count,
          reviewsCount: game.reviews_count,
          suggestionsCount: game.suggestions_count,
          esrbRating: game.esrb_rating?.name
        };
      });

    return {
      results: transformedResults,
      count: data.count,
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch games');
  }
}

export async function getPopularGames(): Promise<Game[]> {
  const response = await getGames({
    ordering: '-metacritic',
    metacritic: '80,100',
  });
  return response.results;
}

export async function getTrendingGames(): Promise<Game[]> {
  const response = await getGames({
    ordering: '-added',
    dates: getLastMonthDate(),
  });
  return response.results;
}

export async function getGameDetails(gameId: string | number): Promise<GameDetails> {
  if (!API_CONFIG.API_KEY) {
    throw new Error('API key is not configured');
  }

  try {
    const gameUrl = `${API_CONFIG.BASE_URL}/games/${gameId}?key=${API_CONFIG.API_KEY}`;
    const gameResponse = await fetchWithRetry(gameUrl, { next: { revalidate: 3600 } });

    if (!gameResponse.ok) {
      console.error('Failed to fetch game details:', {
        status: gameResponse.status,
        statusText: gameResponse.statusText,
        gameId,
      });
      throw new Error(`Failed to fetch game details: ${gameResponse.statusText}`);
    }

    const gameData = await gameResponse.json();
    
    if (!gameData || !gameData.id) {
      console.error('Invalid game data received:', { gameId, gameData });
      throw new Error('Invalid game data received');
    }

    const screenshotsUrl = `${API_CONFIG.BASE_URL}/games/${gameId}/screenshots?key=${API_CONFIG.API_KEY}`;
    const screenshotsResponse = await fetchWithRetry(screenshotsUrl, { next: { revalidate: 3600 } });
    const screenshotsData = await screenshotsResponse.json();

    // Combine background image with screenshots, filter out any null values
    const screenshots = [
      gameData.background_image,
      ...(screenshotsData.results || []).map((s: { image: string }) => s.image),
    ].filter(Boolean);

    // Transform the API response to match our GameDetails interface
    return {
      id: gameData.id.toString(),
      name: gameData.name,
      title: gameData.name,
      coverUrl: gameData.background_image,
      platforms: gameData.platforms?.map((p: RawGamePlatform) => ({
        platform: p.platform.name,
        released_at: p.released_at,
        requirements: p.requirements
      })) || [],
      genres: gameData.genres?.map((g: RawGameGenre) => g.name) || [],
      rating: calculateRating(gameData),
      releaseDate: gameData.released,
      metacritic: gameData.metacritic,
      description: gameData.description_raw || '',
      screenshots,  // Use the combined screenshots array
      website: gameData.website,
      metacritic_url: gameData.metacritic_url,
      developers: gameData.developers?.map((d: RawGameDeveloper) => d.name) || [],
      publishers: gameData.publishers?.map((p: RawGamePublisher) => p.name) || [],
      released: gameData.released,
      tba: gameData.tba,
      ratings: gameData.ratings,
      stores: gameData.stores?.map((s: RawGameStore) => ({
        store: s.store.name,
        url: s.url
      })),
      tags: gameData.tags?.map((t: RawGameTag) => t.name)
    };
  } catch (error) {
    console.error('Error in getGameDetails:', error);
    throw error;
  }
}
