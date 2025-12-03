import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.playSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.completedAt) {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    const completedAt = new Date();
    const totalTimeSeconds = Math.floor(
      (completedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    const updated = await prisma.playSession.update({
      where: { id: sessionId },
      data: {
        completedAt,
        totalTimeSeconds,
      },
    });

    return NextResponse.json({
      completedAt: updated.completedAt,
      totalTimeSeconds: updated.totalTimeSeconds,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}
