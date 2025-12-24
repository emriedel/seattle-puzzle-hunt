'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Delete } from 'lucide-react';
import { Button } from './ui/button';

type Direction = 'U' | 'D' | 'L' | 'R';

interface DirectionalPadInputProps {
  maxLength?: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const DIRECTION_MAP: Record<Direction, { icon: any; label: string; full: string }> = {
  U: { icon: ArrowUp, label: '↑', full: 'UP' },
  D: { icon: ArrowDown, label: '↓', full: 'DOWN' },
  L: { icon: ArrowLeft, label: '←', full: 'LEFT' },
  R: { icon: ArrowRight, label: '→', full: 'RIGHT' },
};

export default function DirectionalPadInput({
  maxLength,
  onSubmit,
  disabled,
}: DirectionalPadInputProps) {
  const [sequence, setSequence] = useState<Direction[]>([]);

  const addDirection = (direction: Direction) => {
    if (disabled) return;
    if (maxLength && sequence.length >= maxLength) return;
    setSequence([...sequence, direction]);
  };

  const removeLastDirection = () => {
    if (disabled || sequence.length === 0) return;
    setSequence(sequence.slice(0, -1));
  };

  const resetSequence = () => {
    if (disabled) return;
    setSequence([]);
  };

  const handleSubmit = () => {
    if (disabled || sequence.length === 0) return;
    // Convert to compressed string (e.g., ['U', 'R', 'D', 'L'] => "URDL")
    const answer = sequence.join('');
    onSubmit(answer);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-md">
      {/* Sequence display */}
      <div className="min-h-16 p-4 rounded-lg border-2 border-muted bg-muted/10 flex items-center justify-center flex-wrap gap-2 w-full">
        {sequence.length === 0 ? (
          <span className="text-muted-foreground italic">Tap arrows below...</span>
        ) : (
          sequence.map((dir, index) => {
            const Icon = DIRECTION_MAP[dir].icon;
            return (
              <div
                key={index}
                className="w-10 h-10 rounded bg-primary/20 border border-primary flex items-center justify-center"
              >
                <Icon className="w-6 h-6 text-primary" />
              </div>
            );
          })
        )}
      </div>

      {/* Directional pad */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {/* Top row */}
        <div></div>
        <Button
          onClick={() => addDirection('U')}
          disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
          size="lg"
          variant="outline"
          className="h-20 w-full"
        >
          <ArrowUp className="w-16 h-16" />
        </Button>
        <div></div>

        {/* Middle row */}
        <Button
          onClick={() => addDirection('L')}
          disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
          size="lg"
          variant="outline"
          className="h-20 w-full"
        >
          <ArrowLeft className="w-16 h-16" />
        </Button>
        <div></div>
        <Button
          onClick={() => addDirection('R')}
          disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
          size="lg"
          variant="outline"
          className="h-20 w-full"
        >
          <ArrowRight className="w-16 h-16" />
        </Button>

        {/* Bottom row */}
        <div></div>
        <Button
          onClick={() => addDirection('D')}
          disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
          size="lg"
          variant="outline"
          className="h-20 w-full"
        >
          <ArrowDown className="w-16 h-16" />
        </Button>
        <div></div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <Button
          onClick={removeLastDirection}
          disabled={disabled || sequence.length === 0}
          variant="outline"
          className="flex-1"
        >
          <Delete className="w-4 h-4 mr-2" />
          Backspace
        </Button>
        <Button
          onClick={resetSequence}
          disabled={disabled || sequence.length === 0}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || sequence.length === 0}
        size="lg"
        className="w-auto px-12 bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Checking...' : 'Submit'}
      </Button>
    </div>
  );
}
