import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { huntId, clientId } = await request.json();

    if (!huntId || !clientId) {
      return NextResponse.json(
        { error: 'huntId and clientId are required' },
        { status: 400 }
      );
    }

    // Verify hunt exists
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json(
        { error: 'Hunt not found' },
        { status: 404 }
      );
    }

    // Create new play session
    const session = await prisma.playSession.create({
      data: {
        huntId,
        clientId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
