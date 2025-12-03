import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeAnswer(answer: string, puzzleType: string, answerLength: number): string {
  if (puzzleType === 'word_code') {
    // Strip non-alpha, uppercase
    return answer.replace(/[^a-zA-Z]/g, '').toUpperCase();
  } else if (puzzleType === 'number_code') {
    // Strip non-digits, zero-pad
    const digits = answer.replace(/\D/g, '');
    return digits.padStart(answerLength, '0');
  }
  return answer;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { locationId, answer } = await request.json();

    if (!locationId || !answer) {
      return NextResponse.json(
        { error: 'locationId and answer are required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await prisma.playSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get location with puzzle answer
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        puzzleAnswer: true,
        puzzleType: true,
        puzzleAnswerLength: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Normalize the provided answer
    const normalizedAnswer = normalizeAnswer(
      answer,
      location.puzzleType,
      location.puzzleAnswerLength
    );

    // Check if correct
    const correct = normalizedAnswer === location.puzzleAnswer;

    // If incorrect, increment wrong puzzle guesses
    if (!correct) {
      await prisma.playSession.update({
        where: { id: sessionId },
        data: {
          wrongPuzzleGuesses: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ correct });
  } catch (error) {
    console.error('Error validating puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to validate puzzle' },
      { status: 500 }
    );
  }
}
