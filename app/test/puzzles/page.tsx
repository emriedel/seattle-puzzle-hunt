'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NumericCryptexInput from '@/components/NumericCryptexInput';
import SafeDialInput from '@/components/SafeDialInput';
import CryptexInput from '@/components/CryptexInput';
import ToggleSwitchInput from '@/components/ToggleSwitchInput';
import DirectionalPadInput from '@/components/DirectionalPadInput';
import ColorCodeInput, { ColorConfig } from '@/components/ColorCodeInput';
import MorseCodeInput from '@/components/MorseCodeInput';
import TileWordBuilderInput from '@/components/TileWordBuilderInput';
import TileImageBuilderInput from '@/components/TileImageBuilderInput';
import SlidePuzzleInput from '@/components/SlidePuzzleInput';

interface PuzzleTest {
  name: string;
  type: string;
  answer: string;
  component: React.ReactNode;
  result?: 'correct' | 'incorrect' | null;
}

export default function PuzzleTestPage() {
  const [results, setResults] = useState<Record<string, 'correct' | 'incorrect' | null>>({});

  const handleTest = (puzzleType: string, answer: string | number[], expected: string | number[]) => {
    let isCorrect: boolean;

    if (Array.isArray(answer) && Array.isArray(expected)) {
      // Array comparison (for safe dial)
      isCorrect = answer.length === expected.length &&
        answer.every((val, idx) => val === expected[idx]);
    } else if (typeof answer === 'string' && typeof expected === 'string') {
      // String comparison (for most puzzles)
      isCorrect = answer.toUpperCase() === expected.toUpperCase();
    } else {
      isCorrect = false;
    }

    setResults({ ...results, [puzzleType]: isCorrect ? 'correct' : 'incorrect' });
  };

  const puzzles: PuzzleTest[] = [
    {
      name: 'Numeric Cryptex',
      type: 'number_code.cryptex',
      answer: '3725',
      component: (
        <NumericCryptexInput
          length={4}
          onSubmit={(ans) => handleTest('number_code.cryptex', ans, '3725')}
        />
      ),
    },
    {
      name: 'Safe Dial',
      type: 'number_code.safe',
      answer: '[15, 30, 45]',
      component: (
        <SafeDialInput
          length={3}
          onSubmit={(ans) => handleTest('number_code.safe', ans, [15, 30, 45])}
        />
      ),
    },
    {
      name: 'Word Cryptex',
      type: 'word_code',
      answer: 'BOOK',
      component: (
        <CryptexInput
          length={4}
          onSubmit={(ans) => handleTest('word_code', ans, 'BOOK')}
        />
      ),
    },
    {
      name: 'Toggle Switches',
      type: 'toggle_code',
      answer: '101100',
      component: (
        <ToggleSwitchInput
          switchCount={6}
          onSubmit={(ans) => handleTest('toggle_code', ans, '101100')}
        />
      ),
    },
    {
      name: 'Directional Pad',
      type: 'directional_code',
      answer: 'URDL',
      component: (
        <DirectionalPadInput
          maxLength={4}
          onSubmit={(ans) => handleTest('directional_code', ans, 'URDL')}
        />
      ),
    },
    {
      name: 'Color Code',
      type: 'color_code',
      answer: 'RGYB',
      component: (() => {
        const defaultColors: ColorConfig[] = [
          { code: 'R', color: 'Red', label: 'Red' },
          { code: 'G', color: 'Green', label: 'Green' },
          { code: 'B', color: 'Blue', label: 'Blue' },
          { code: 'Y', color: 'Yellow', label: 'Yellow' },
        ];
        return (
          <ColorCodeInput
            colors={defaultColors}
            maxLength={4}
            onSubmit={(ans) => handleTest('color_code', ans, 'RGYB')}
          />
        );
      })(),
    },
    {
      name: 'Morse Code',
      type: 'morse_code',
      answer: '...---...',
      component: (
        <MorseCodeInput
          onSubmit={(ans) => handleTest('morse_code', ans, '...---...')}
        />
      ),
    },
    {
      name: 'Tile Word Builder',
      type: 'tile_word',
      answer: 'BOOK',
      component: (
        <TileWordBuilderInput
          tiles={['B', 'O', 'O', 'K']}
          onSubmit={(ans) => handleTest('tile_word', ans, 'BOOK')}
        />
      ),
    },
    {
      name: 'Tile Image Builder',
      type: 'tile_image',
      answer: '2,1,3',
      component: (
        <TileImageBuilderInput
          images={[
            '/puzzle-images/step1.svg',
            '/puzzle-images/step2.svg',
            '/puzzle-images/step3.svg',
          ]}
          onSubmit={(ans) => handleTest('tile_image', ans, '2,1,3')}
        />
      ),
    },
    {
      name: 'Slide Puzzle',
      type: 'slide_puzzle',
      answer: 'SOLVED',
      component: (
        <SlidePuzzleInput
          imagePath="/puzzle-images/test-puzzle.svg"
          onSubmit={(ans) => handleTest('slide_puzzle', ans, 'SOLVED')}
          showReset={true}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/hunts">
            <Button variant="outline" className="mb-4">
              ← Back to Hunts
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Puzzle Input Types Test Page</h1>
          <p className="text-muted-foreground">
            Test all puzzle input mechanisms. Try to enter the correct answer for each type.
          </p>
        </div>

        {/* Puzzles grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {puzzles.map((puzzle) => (
            <Card key={puzzle.type} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{puzzle.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: <code className="bg-muted px-2 py-0.5 rounded">{puzzle.type}</code>
                    </p>
                  </div>
                  {results[puzzle.type] && (
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        results[puzzle.type] === 'correct'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-red-500/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {results[puzzle.type] === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                  )}
                </div>
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
                  <span className="font-semibold">Answer:</span>{' '}
                  <code className="font-mono">{puzzle.answer}</code>
                </div>
              </CardHeader>
              <CardContent className={`pt-6 ${
                ['directional_code', 'simon_code', 'morse_code'].includes(puzzle.type)
                  ? 'flex justify-center'
                  : ''
              }`}>
                {puzzle.component}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-center text-muted-foreground">
          This page demonstrates all available puzzle input types. In actual hunts, only one input type appears per puzzle.
        </div>
      </div>
    </div>
  );
}
