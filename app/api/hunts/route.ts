import { NextResponse } from 'next/server';
import { getCachedHunts } from '@/lib/hunt-queries';

export async function GET() {
  try {
    const hunts = await getCachedHunts();
    return NextResponse.json(hunts);
  } catch (error) {
    console.error('Error fetching hunts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hunts' },
      { status: 500 }
    );
  }
}
