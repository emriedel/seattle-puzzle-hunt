import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hunt = await prisma.hunt.findUnique({
      where: { id },
      include: {
        locations: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            order: true,
            lat: true,
            lng: true,
            narrativeSnippet: true,
            puzzleType: true,
            puzzlePrompt: true,
            puzzleImage: true,
            puzzleAnswerLength: true,
            nextRiddle: true,
            nextLocationId: true,
            // Explicitly exclude puzzleAnswer
          },
        },
      },
    });

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
