import { NextResponse } from 'next/server';
import { getCachedHunt } from '@/lib/hunt-queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hunt = await getCachedHunt(id);

    if (!hunt) {
      return NextResponse.json(
        { error: 'Hunt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(hunt);
  } catch (error) {
    console.error('Error fetching hunt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hunt' },
      { status: 500 }
    );
  }
}
