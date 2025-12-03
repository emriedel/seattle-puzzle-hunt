import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { huntId, sessionId, name, message } = await request.json();

    if (!huntId) {
      return NextResponse.json(
        { error: 'huntId is required' },
        { status: 400 }
      );
    }

    const entry = await prisma.logbookEntry.create({
      data: {
        huntId,
        sessionId: sessionId || null,
        name: name || null,
        message: message || null,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error creating logbook entry:', error);
    return NextResponse.json(
      { error: 'Failed to create logbook entry' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const huntId = searchParams.get('huntId');

    if (!huntId) {
      return NextResponse.json(
        { error: 'huntId is required' },
        { status: 400 }
      );
    }

    const entries = await prisma.logbookEntry.findMany({
      where: { huntId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching logbook entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logbook entries' },
      { status: 500 }
    );
  }
}
