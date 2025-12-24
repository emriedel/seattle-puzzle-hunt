'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface LockboxSliderInputProps {
  min?: number;
  max?: number;
  step?: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function LockboxSliderInput({
  min = 0,
  max = 9,
  step = 1,
  onSubmit,
  disabled,
}: LockboxSliderInputProps) {
  const [value, setValue] = useState<number>(min);

  const handleSubmit = () => {
    if (disabled) return;
    onSubmit(value.toString());
  };

  // Generate tick marks
  const tickMarks = [];
  for (let i = min; i <= max; i += step) {
    tickMarks.push(i);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-md">
      {/* Current value display */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-1">Selected Value</div>
        <div className="text-5xl font-bold font-mono text-foreground">
          {value}
        </div>
      </div>

      {/* Slider */}
      <div className="w-full px-4">
        <Slider
          value={[value]}
          onValueChange={(values) => setValue(values[0])}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />

        {/* Tick marks */}
        <div className="relative w-full mt-2">
          <div className="flex justify-between">
            {tickMarks.map((tick) => (
              <div key={tick} className="flex flex-col items-center">
                <div className="w-px h-2 bg-muted-foreground/30"></div>
                <span className="text-xs text-muted-foreground mt-1 font-mono">
                  {tick}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        size="lg"
        className="w-full max-w-xs bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Checking...' : 'Submit Answer'}
      </Button>
    </div>
  );
}
