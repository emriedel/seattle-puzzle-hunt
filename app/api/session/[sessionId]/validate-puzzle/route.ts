import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeAnswer(answer: string | number[], puzzleType: string, answerLength: number): string {
  if (puzzleType === 'word_code') {
    // Strip non-alpha, uppercase
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^a-zA-Z]/g, '').toUpperCase();
  } else if (puzzleType === 'number_code.safe') {
    // Safe dial: accept array of numbers [62, 31, 12, 12] and convert to "62311212"
    if (Array.isArray(answer)) {
      return answer.map(n => n.toString().padStart(2, '0')).join('');
    }
    // Fallback for string input (backwards compatibility)
    if (typeof answer === 'string') {
      const digits = answer.replace(/\D/g, '');
      return digits.padStart(answerLength * 2, '0');
    }
    return '';
  } else if (puzzleType.startsWith('number_code')) {
    // Strip non-digits, zero-pad (handles number_code, number_code.cryptex)
    if (typeof answer !== 'string') return '';
    const digits = answer.replace(/\D/g, '');
    return digits.padStart(answerLength, '0');
  } else if (puzzleType === 'slider_code') {
    // Strip non-digits, no padding needed (single digit)
    if (typeof answer !== 'string') return '';
    return answer.replace(/\D/g, '');
  } else if (puzzleType === 'toggle_code') {
    // Binary string - strip non-01 characters
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^01]/g, '');
  } else if (puzzleType === 'directional_code') {
    // Directional sequence - strip non-UDLR characters, uppercase
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^UDLRudlr]/g, '').toUpperCase();
  } else if (puzzleType === 'simon_code') {
    // Legacy color sequence - strip non-RGBY characters, uppercase
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^RGBYrgby]/g, '').toUpperCase();
  } else if (puzzleType === 'color_code') {
    // Custom color sequence - accept answer as-is (codes are defined in puzzleConfig)
    if (typeof answer !== 'string') return '';
    return answer.trim();
  } else if (puzzleType === 'morse_code') {
    // Morse code - strip anything that's not dot or dash
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^.\-]/g, '');
  } else if (puzzleType === 'tile_word') {
    // Tile word - strip non-alpha, uppercase (like word_code)
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^a-zA-Z]/g, '').toUpperCase();
  } else if (puzzleType === 'tile_image') {
    // Tile image - strip non-digits and non-commas, trim whitespace
    if (typeof answer !== 'string') return '';
    return answer.replace(/[^0-9,]/g, '').trim();
  } else if (puzzleType === 'slide_puzzle') {
    // Slide puzzle - auto-validates when solved, answer should be 'SOLVED'
    if (typeof answer !== 'string') return '';
    return answer.toUpperCase().trim();
  }
  return typeof answer === 'string' ? answer : '';
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
