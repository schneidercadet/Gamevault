import { NextRequest, NextResponse } from 'next/server';
import { getGames } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const pageSize = parseInt(searchParams.get('pageSize') || '40');
    const ordering = searchParams.get('ordering') || '-popularity_precise,-metacritic';
    const metacritic = searchParams.get('metacritic') || '100';
    const dates = searchParams.get('dates') || undefined;
    const platforms = searchParams.get('platforms') || '4,5,6';

    const data = await getGames({
      page,
      search,
      pageSize,
      ordering,
      metacritic,
      dates,
      platforms,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
