'use client';

import { useState } from 'react';
import { Circle, Square, Triangle, Star, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

type ColorKey = 'R' | 'G' | 'B' | 'Y';

interface SimonPatternInputProps {
  maxLength?: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const COLOR_CONFIG: Record<ColorKey, { name: string; bg: string; hover: string; active: string; icon: any; label: string }> = {
  R: {
    name: 'red',
    bg: 'bg-red-500',
    hover: 'hover:bg-red-600',
    active: 'active:bg-red-700',
    icon: Circle,
    label: 'Red',
  },
  G: {
    name: 'green',
    bg: 'bg-green-500',
    hover: 'hover:bg-green-600',
    active: 'active:bg-green-700',
    icon: Square,
    label: 'Green',
  },
  B: {
    name: 'blue',
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    active: 'active:bg-blue-700',
    icon: Triangle,
    label: 'Blue',
  },
  Y: {
    name: 'yellow',
    bg: 'bg-yellow-500',
    hover: 'hover:bg-yellow-600',
    active: 'active:bg-yellow-700',
    icon: Star,
    label: 'Yellow',
  },
};

export default function SimonPatternInput({
  maxLength,
  onSubmit,
  disabled,
}: SimonPatternInputProps) {
  const [sequence, setSequence] = useState<ColorKey[]>([]);
  const [flashingColor, setFlashingColor] = useState<ColorKey | null>(null);

  const addColor = (color: ColorKey) => {
    if (disabled) return;
    if (maxLength && sequence.length >= maxLength) return;

    // Visual feedback - flash the button
    setFlashingColor(color);
    setTimeout(() => setFlashingColor(null), 200);

    setSequence([...sequence, color]);
  };

  const resetSequence = () => {
    if (disabled) return;
    setSequence([]);
  };

  const removeLastColor = () => {
    if (disabled || sequence.length === 0) return;
    setSequence(sequence.slice(0, -1));
  };

  const handleSubmit = () => {
    if (disabled || sequence.length === 0) return;
    // Convert to compressed string (e.g., ['R', 'G', 'Y', 'B'] => "RGYB")
    const answer = sequence.join('');
    onSubmit(answer);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-md">
      {/* Sequence display */}
      <div className="min-h-16 p-4 rounded-lg border-2 border-muted bg-muted/10 flex items-center justify-center flex-wrap gap-2 w-full">
        {sequence.length === 0 ? (
          <span className="text-muted-foreground italic">Tap colors below...</span>
        ) : (
          sequence.map((colorKey, index) => {
            const config = COLOR_CONFIG[colorKey];
            const Icon = config.icon;
            return (
              <div
                key={index}
                className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center shadow-md`}
                title={config.label}
              >
                <Icon className="w-8 h-8 text-white" fill="white" />
              </div>
            );
          })
        )}
      </div>

      {/* Color buttons grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {(Object.keys(COLOR_CONFIG) as ColorKey[]).map((colorKey) => {
          const config = COLOR_CONFIG[colorKey];
          const Icon = config.icon;
          const isFlashing = flashingColor === colorKey;

          return (
            <Button
              key={colorKey}
              onClick={() => addColor(colorKey)}
              disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
              size="lg"
              variant="outline"
              className={`
                h-20 w-full
                ${config.bg} ${config.hover} ${config.active}
                border-0
                ${isFlashing ? 'scale-95 brightness-125' : 'scale-100'}
                transition-all duration-200
              `}
              aria-label={config.label}
            >
              <Icon className="w-12 h-12 text-white" fill="white" strokeWidth={1.5} />
            </Button>
          );
        })}
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={removeLastColor}
          disabled={disabled || sequence.length === 0}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Undo
        </Button>
        <Button
          onClick={resetSequence}
          disabled={disabled || sequence.length === 0}
          variant="outline"
          className="flex-1"
        >
          Clear
        </Button>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || sequence.length === 0}
        size="lg"
        variant="secondary"
        className="w-auto px-12"
      >
        {disabled ? 'Checking...' : 'Submit'}
      </Button>
    </div>
  );
}
