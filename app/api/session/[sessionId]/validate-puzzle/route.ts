import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeAnswer(answer: string, puzzleType: string, answerLength: number): string {
  if (puzzleType === 'word_code') {
    // Strip non-alpha, uppercase
    return answer.replace(/[^a-zA-Z]/g, '').toUpperCase();
  } else if (puzzleType.startsWith('number_code')) {
    // Strip non-digits, zero-pad (handles number_code, number_code.cryptex, number_code.safe)
    const digits = answer.replace(/\D/g, '');
    return digits.padStart(answerLength, '0');
  } else if (puzzleType === 'slider_code') {
    // Strip non-digits, no padding needed (single digit)
    return answer.replace(/\D/g, '');
  } else if (puzzleType === 'toggle_code') {
    // Binary string - strip non-01 characters
    return answer.replace(/[^01]/g, '');
  } else if (puzzleType === 'directional_code') {
    // Directional sequence - strip non-UDLR characters, uppercase
    return answer.replace(/[^UDLRudlr]/g, '').toUpperCase();
  } else if (puzzleType === 'simon_code') {
    // Color sequence - strip non-RGBY characters, uppercase
    return answer.replace(/[^RGBYrgby]/g, '').toUpperCase();
  } else if (puzzleType === 'morse_code') {
    // Morse code - strip anything that's not dot or dash
    return answer.replace(/[^.\-]/g, '');
  } else if (puzzleType === 'tile_word') {
    // Tile word - strip non-alpha, uppercase (like word_code)
    return answer.replace(/[^a-zA-Z]/g, '').toUpperCase();
  } else if (puzzleType === 'slide_puzzle') {
    // Slide puzzle - auto-validates when solved, answer should be 'SOLVED'
    return answer.toUpperCase().trim();
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
