'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface WordCodeInputProps {
  length: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function WordCodeInput({ length, onSubmit, disabled = false }: WordCodeInputProps) {
  const [letters, setLetters] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow letters
    const letter = value.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();

    const newLetters = [...letters];
    newLetters[index] = letter;
    setLetters(newLetters);

    // Auto-focus next input
    if (letter && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !letters[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && letters.every(l => l !== '')) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const answer = letters.join('');
    if (answer.length === length) {
      onSubmit(answer);
    }
  };

  const isComplete = letters.every(l => l !== '');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {letters.map((letter, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            maxLength={1}
            value={letter}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            disabled={disabled}
            className="w-12 h-14 text-center text-2xl font-bold uppercase bg-background border-2 border-input rounded-lg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isComplete || disabled}
        size="lg"
      >
        Submit Answer
      </Button>
    </div>
  );
}
