import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const game = await getGameDetails(id);
    return NextResponse.json(game);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}