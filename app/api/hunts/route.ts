import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const hunts = await prisma.hunt.findMany({
      select: {
        id: true,
        title: true,
        neighborhood: true,
        description: true,
        estimatedTimeMinutes: true,
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(hunts);
  } catch (error) {
    console.error('Error fetching hunts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hunts' },
      { status: 500 }
    );
  }
}
