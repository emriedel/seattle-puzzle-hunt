'use client';

import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface CryptexInputProps {
  length: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

interface WheelProps {
  value: string;
  onChange: (letter: string) => void;
  disabled?: boolean;
}

function CryptexWheel({ value, onChange, disabled }: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get index of current letter
  const letterIndex = ALPHABET.indexOf(value);

  // Cycle to next letter (with wrapping)
  const incrementLetter = () => {
    if (disabled) return;
    const currentIdx = ALPHABET.indexOf(value);
    const nextIdx = (currentIdx + 1) % 26;
    onChange(ALPHABET[nextIdx]);
  };

  // Cycle to previous letter (with wrapping)
  const decrementLetter = () => {
    if (disabled) return;
    const currentIdx = ALPHABET.indexOf(value);
    const prevIdx = (currentIdx - 1 + 26) % 26;
    onChange(ALPHABET[prevIdx]);
  };

  // Get adjacent letters for display
  const getAdjacentLetters = () => {
    const idx = ALPHABET.indexOf(value);
    const prev2 = ALPHABET[(idx - 2 + 26) % 26];
    const prev1 = ALPHABET[(idx - 1 + 26) % 26];
    const next1 = ALPHABET[(idx + 1) % 26];
    const next2 = ALPHABET[(idx + 2) % 26];
    return { prev2, prev1, next1, next2 };
  };

  const adjacent = getAdjacentLetters();

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentIndex(ALPHABET.indexOf(value));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const sensitivity = 30; // pixels per letter
    const steps = Math.round(deltaY / sensitivity);

    if (Math.abs(steps) > 0) {
      const newIndex = (currentIndex + steps + 26 * 100) % 26; // Add large multiple to handle negatives
      onChange(ALPHABET[newIndex]);
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
    setCurrentIndex(ALPHABET.indexOf(value));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const currentY = e.clientY;
    const deltaY = startY - currentY;
    const sensitivity = 30;
    const steps = Math.round(deltaY / sensitivity);

    if (Math.abs(steps) > 0) {
      const newIndex = (currentIndex + steps + 26 * 100) % 26;
      onChange(ALPHABET[newIndex]);
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
        onClick={decrementLetter}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
        aria-label="Previous letter"
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
        }}
      >
        {/* Letter stack - showing 5 letters total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Previous letters (faded) */}
          <div className="text-lg font-bold text-muted-foreground/20">
            {adjacent.prev2}
          </div>
          <div className="text-xl font-bold text-muted-foreground/40">
            {adjacent.prev1}
          </div>

          {/* Current letter (prominent) */}
          <div className="relative">
            <div className="absolute inset-0 -inset-x-2 bg-primary/10 rounded"></div>
            <div className="relative text-4xl font-bold text-foreground px-2 py-1">
              {value}
            </div>
          </div>

          {/* Next letters (faded) */}
          <div className="text-xl font-bold text-muted-foreground/40">
            {adjacent.next1}
          </div>
          <div className="text-lg font-bold text-muted-foreground/20">
            {adjacent.next2}
          </div>
        </div>

        {/* Gradient overlays for depth effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Down Arrow */}
      <button
        onClick={incrementLetter}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
        aria-label="Next letter"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function CryptexInput({ length, onSubmit, disabled }: CryptexInputProps) {
  // Initialize all wheels to 'A'
  const [letters, setLetters] = useState<string[]>(Array(length).fill('A'));

  const handleWheelChange = (index: number, letter: string) => {
    const newLetters = [...letters];
    newLetters[index] = letter;
    setLetters(newLetters);
  };

  const handleSubmit = () => {
    if (disabled) return;
    const answer = letters.join('');
    onSubmit(answer);
  };

  // Check if all wheels have been set (not needed since they all start at A, but keeping for consistency)
  const isComplete = letters.every(l => l !== '');

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Cryptex wheels */}
      <div className="flex gap-3 justify-center flex-wrap">
        {letters.map((letter, index) => (
          <CryptexWheel
            key={index}
            value={letter}
            onChange={(newLetter) => handleWheelChange(index, newLetter)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || !isComplete}
        size="lg"
        variant="secondary"
        className="w-auto px-12"
      >
        {disabled ? 'Checking...' : 'Submit'}
      </Button>
    </div>
  );
}
