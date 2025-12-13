'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

interface ToggleSwitchInputProps {
  switchCount: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  initialValue?: string;
  readOnly?: boolean;
}

export default function ToggleSwitchInput({
  switchCount,
  onSubmit,
  disabled,
  initialValue,
  readOnly,
}: ToggleSwitchInputProps) {
  // Initialize with initialValue if provided, otherwise mixed state (alternating pattern)
  const [switches, setSwitches] = useState<boolean[]>(() => {
    if (initialValue) {
      return initialValue.split('').map(c => c === '1');
    }
    return Array(switchCount).fill(false).map((_, i) => i % 2 === 0);
  });

  const handleToggle = (index: number) => {
    if (disabled || readOnly) return;
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  const handleSubmit = () => {
    if (disabled || readOnly) return;
    // Convert boolean array to binary string (e.g., [true, false, true] => "101")
    const answer = switches.map(s => s ? '1' : '0').join('');
    onSubmit(answer);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full">
      {/* Switches - horizontal layout */}
      <div className="flex gap-3 justify-center flex-wrap">
        {switches.map((isOn, index) => (
          <button
            key={index}
            onClick={() => handleToggle(index)}
            disabled={disabled || readOnly}
            className="relative w-16 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Switch lever */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-10 h-14 rounded-md transition-all duration-300 ${
                isOn
                  ? 'top-1.5 bg-gradient-to-br from-green-400 to-green-600 shadow-md'
                  : 'bottom-1.5 bg-gradient-to-br from-red-400 to-red-600 shadow-md'
              }`}
              style={{
                boxShadow: isOn
                  ? '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)'
                  : '0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {/* Lever grip lines */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <div className="w-6 h-0.5 bg-white/30 rounded"></div>
                <div className="w-6 h-0.5 bg-white/30 rounded"></div>
                <div className="w-6 h-0.5 bg-white/30 rounded"></div>
              </div>
            </div>

            {/* Top/Bottom indicators */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
          </button>
        ))}
      </div>

      {/* Submit button - hide when readOnly */}
      {!readOnly && (
        <Button
          onClick={handleSubmit}
          disabled={disabled}
          size="lg"
          variant="secondary"
          className="w-auto px-12"
        >
          {disabled ? 'Checking...' : 'Submit'}
        </Button>
      )}
    </div>
  );
}
