'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface NumberCodeInputProps {
  length: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function NumberCodeInput({ length, onSubmit, disabled = false }: NumberCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && digits.every(d => d !== '')) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const answer = digits.join('');
    if (answer.length === length) {
      onSubmit(answer);
    }
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            disabled={disabled}
            className="w-12 h-14 text-center text-2xl font-bold bg-background border-2 border-input rounded-lg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isComplete || disabled}
        size="lg"
        className="bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Answer
      </Button>
    </div>
  );
}
