'use client';

import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface NumericCryptexInputProps {
  length: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  initialValue?: string;
  readOnly?: boolean;
}

interface WheelProps {
  value: string;
  onChange: (digit: string) => void;
  disabled?: boolean;
}

function NumericWheel({ value, onChange, disabled }: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get index of current digit
  const digitIndex = DIGITS.indexOf(value);

  // Cycle to next digit (with wrapping)
  const incrementDigit = () => {
    if (disabled) return;
    const currentIdx = DIGITS.indexOf(value);
    const nextIdx = (currentIdx + 1) % 10;
    onChange(DIGITS[nextIdx]);
  };

  // Cycle to previous digit (with wrapping)
  const decrementDigit = () => {
    if (disabled) return;
    const currentIdx = DIGITS.indexOf(value);
    const prevIdx = (currentIdx - 1 + 10) % 10;
    onChange(DIGITS[prevIdx]);
  };

  // Get adjacent digits for display
  const getAdjacentDigits = () => {
    const idx = DIGITS.indexOf(value);
    const prev2 = DIGITS[(idx - 2 + 10) % 10];
    const prev1 = DIGITS[(idx - 1 + 10) % 10];
    const next1 = DIGITS[(idx + 1) % 10];
    const next2 = DIGITS[(idx + 2) % 10];
    return { prev2, prev1, next1, next2 };
  };

  const adjacent = getAdjacentDigits();

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentIndex(DIGITS.indexOf(value));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    e.preventDefault(); // Prevent page scrolling while dragging
    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const sensitivity = 30; // pixels per digit
    const steps = Math.round(deltaY / sensitivity);

    if (Math.abs(steps) > 0) {
      const newIndex = (currentIndex + steps + 10 * 100) % 10; // Add large multiple to handle negatives
      onChange(DIGITS[newIndex]);
      setStartY(currentY);
      setCurrentIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentIndex(DIGITS.indexOf(value));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const currentY = e.clientY;
    const deltaY = startY - currentY;
    const sensitivity = 30;
    const steps = Math.round(deltaY / sensitivity);

    if (Math.abs(steps) > 0) {
      const newIndex = (currentIndex + steps + 10 * 100) % 10;
      onChange(DIGITS[newIndex]);
      setStartY(currentY);
      setCurrentIndex(newIndex);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Scroll wheel handler - disabled to prevent accidental changes while scrolling page
  // Users can use drag/swipe or arrow buttons instead
  const handleWheel = (e: React.WheelEvent) => {
    // Disabled
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Up Arrow */}
      <button
        onClick={decrementDigit}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
        aria-label="Previous digit"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Wheel Container */}
      <div
        ref={wheelRef}
        className={`relative w-16 h-32 flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-lg ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Digit stack - showing 5 digits total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Previous digits (faded) */}
          <div className="text-lg font-bold text-muted-foreground/20 font-mono">
            {adjacent.prev2}
          </div>
          <div className="text-xl font-bold text-muted-foreground/40 font-mono">
            {adjacent.prev1}
          </div>

          {/* Current digit (prominent) */}
          <div className="relative">
            <div className="absolute inset-0 -inset-x-2 bg-primary/10 rounded"></div>
            <div className="relative text-4xl font-bold text-foreground px-2 py-1 font-mono">
              {value}
            </div>
          </div>

          {/* Next digits (faded) */}
          <div className="text-xl font-bold text-muted-foreground/40 font-mono">
            {adjacent.next1}
          </div>
          <div className="text-lg font-bold text-muted-foreground/20 font-mono">
            {adjacent.next2}
          </div>
        </div>

        {/* Gradient overlays for depth effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Down Arrow */}
      <button
        onClick={incrementDigit}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
        aria-label="Next digit"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function NumericCryptexInput({ length, onSubmit, disabled, initialValue, readOnly }: NumericCryptexInputProps) {
  // Initialize wheels with initialValue if provided, otherwise all '0'
  const [digits, setDigits] = useState<string[]>(() => {
    if (initialValue) {
      return initialValue.padStart(length, '0').split('').slice(0, length);
    }
    return Array(length).fill('0');
  });

  const handleWheelChange = (index: number, digit: string) => {
    if (readOnly) return;
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
  };

  const handleSubmit = () => {
    if (disabled || readOnly) return;
    const answer = digits.join('');
    onSubmit(answer);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Numeric cryptex wheels */}
      <div className="flex gap-3 justify-center flex-wrap">
        {digits.map((digit, index) => (
          <NumericWheel
            key={index}
            value={digit}
            onChange={(newDigit) => handleWheelChange(index, newDigit)}
            disabled={disabled || readOnly}
          />
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
