export interface Game {
  name: string;
  id: string;
  title: string;
  coverUrl: string | null;
  platform: string;
  genre: string;
  rating: number;
  releaseDate: string | null;
  metacritic?: number | null;
  ratingCount?: number | null;
  reviewsCount?: number | null;
  suggestionsCount?: number | null;
  esrbRating?: string | null;
  description?: string;
  screenshots?: string[];
  website?: string | null;
  metacriticUrl?: string | null;
}

export interface GameDetails extends Omit<Game, 'platform' | 'genre'> {
  description: string;
  screenshots: string[];
  website?: string | null;
  metacritic_url?: string | null;
  released?: string | null;
  tba?: boolean;
  ratings?: Array<{
    id: number;
    title: string;
    count: number;
    percent: number;
  }> | null;
  platforms: Array<{
    platform: string;
    released_at?: string | null;
    requirements?: {
      minimum?: string | null;
      recommended?: string | null;
    } | null;
  }>;
  stores?: Array<{
    store: string;
    url: string;
  }> | null;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags?: string[] | null;
}

export interface GamesResponse {
  results: Game[];
  count: number;
  next: string | null;
  previous: string | null;
}
