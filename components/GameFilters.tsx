'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get('platform') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');

  const platforms = ['All', 'PC', 'PlayStation', 'Xbox', 'Nintendo'];
  const genres = [
    'All',
    'Action',
    'Adventure',
    'RPG',
    'Strategy',
    'Sports',
    'Racing',
    'Shooter',
    'Puzzle',
  ];
  const years = ['All', '2024', '2023', '2022', '2021', '2020'];

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'All') {
      params.delete(type.toLowerCase());
    } else {
      params.set(type.toLowerCase(), value);
    }

    // Remove empty params
    ['platform', 'genre', 'year'].forEach(param => {
      if (!params.get(param)) params.delete(param);
    });

    const queryString = params.toString();
    router.push(queryString ? `/games?${queryString}` : '/games');
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div>
        <label htmlFor="platform" className="mb-2 block text-sm font-medium text-foreground-muted">
          Platform
        </label>
        <select
          id="platform"
          value={selectedPlatform}
          onChange={(e) => {
            setSelectedPlatform(e.target.value);
            handleFilterChange('platform', e.target.value);
          }}
          className="w-full rounded-lg bg-background/30 backdrop-blur-sm px-4 py-2 text-foreground ring-1 ring-background-lighter/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="">All Platforms</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="genre" className="mb-2 block text-sm font-medium text-foreground-muted">
          Genre
        </label>
        <select
          id="genre"
          value={selectedGenre}
          onChange={(e) => {
            setSelectedGenre(e.target.value);
            handleFilterChange('genre', e.target.value);
          }}
          className="w-full rounded-lg bg-background/30 backdrop-blur-sm px-4 py-2 text-foreground ring-1 ring-background-lighter/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year" className="mb-2 block text-sm font-medium text-foreground-muted">
          Year
        </label>
        <select
          id="year"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            handleFilterChange('year', e.target.value);
          }}
          className="w-full rounded-lg bg-background/30 backdrop-blur-sm px-4 py-2 text-foreground ring-1 ring-background-lighter/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
