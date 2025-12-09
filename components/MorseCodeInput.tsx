'use client';

import { useState, useRef } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface MorseCodeInputProps {
  holdThreshold?: number; // milliseconds for dash (default 300)
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function MorseCodeInput({
  holdThreshold = 300,
  onSubmit,
  disabled,
}: MorseCodeInputProps) {
  const [code, setCode] = useState<string>('');
  const [isPressed, setIsPressed] = useState(false);
  const pressStartTime = useRef<number>(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (disabled) return;
    setIsPressed(true);
    pressStartTime.current = Date.now();
  };

  const handlePressEnd = () => {
    if (disabled || !isPressed) return;
    setIsPressed(false);

    const pressDuration = Date.now() - pressStartTime.current;
    const symbol = pressDuration >= holdThreshold ? '-' : '.';
    setCode(code + symbol);

    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const removeLastSymbol = () => {
    if (disabled || code.length === 0) return;
    setCode(code.slice(0, -1));
  };

  const clearCode = () => {
    if (disabled) return;
    setCode('');
  };

  const handleSubmit = () => {
    if (disabled || code.length === 0) return;
    onSubmit(code);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-md">
      {/* Morse code display */}
      <div className="w-full">
        <div className="text-sm text-muted-foreground mb-2 text-center">
          Morse Code
        </div>
        <div className="min-h-20 p-4 rounded-lg border-2 border-muted bg-muted/10 flex items-center justify-center">
          {code.length === 0 ? (
            <span className="text-muted-foreground italic">Tap button below...</span>
          ) : (
            <div className="text-4xl font-mono font-bold text-foreground tracking-widest break-all">
              {code}
            </div>
          )}
        </div>
      </div>

      {/* Tap button */}
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => isPressed && handlePressEnd()}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={disabled}
        className={`
          w-full h-32 rounded-xl
          ${isPressed
            ? 'bg-primary/90 scale-95 shadow-inner'
            : 'bg-primary hover:bg-primary/90 shadow-xl'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-100
          flex flex-col items-center justify-center gap-2
          focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary
          select-none
        `}
        aria-label="Tap for dot, hold for dash"
      >
        <div className="text-5xl font-bold text-primary-foreground">
          {isPressed ? '•' : 'TAP'}
        </div>
        <div className="text-sm text-primary-foreground font-medium px-4 text-center">
          {isPressed ? 'Holding...' : 'Quick tap = dot ( . ) • Hold = dash ( - )'}
        </div>
      </button>

      {/* Control buttons */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={removeLastSymbol}
          disabled={disabled || code.length === 0}
          variant="outline"
          className="flex-1"
        >
          <Delete className="w-4 h-4 mr-2" />
          Backspace
        </Button>
        <Button
          onClick={clearCode}
          disabled={disabled || code.length === 0}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || code.length === 0}
        size="lg"
        variant="secondary"
        className="w-auto px-12"
      >
        {disabled ? 'Checking...' : 'Submit'}
      </Button>
    </div>
  );
}
