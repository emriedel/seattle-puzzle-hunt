'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';

// 100 numbers from 0 to 99
const NUMBERS = Array.from({ length: 100 }, (_, i) => i);
const DEGREES_PER_NUMBER = 3.6; // 360 / 100

interface SafeDialInputProps {
  length: number;
  onSubmit: (answer: number[]) => void;
  disabled?: boolean;
  initialValue?: number[];
  readOnly?: boolean;
}

export default function SafeDialInput({ length, onSubmit, disabled, initialValue, readOnly }: SafeDialInputProps) {
  // Initialize with initialValue if provided
  const [selectedNumbers, setSelectedNumbers] = useState<(number | null)[]>(() => {
    if (initialValue && Array.isArray(initialValue)) {
      return [...initialValue, ...Array(Math.max(0, length - initialValue.length)).fill(null)].slice(0, length);
    }
    return Array(length).fill(null);
  });
  const [currentPosition, setCurrentPosition] = useState(() => initialValue ? length : 0);
  const [dialRotation, setDialRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);

  const dialRef = useRef<HTMLDivElement>(null);

  // Get the number currently at the top (0 degrees) based on rotation
  const getCurrentNumber = (rotation: number) => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const numberIndex = Math.round((360 - normalizedRotation) / DEGREES_PER_NUMBER) % 100;
    return NUMBERS[numberIndex];
  };

  // Snap rotation to nearest number
  const snapToNearestNumber = (rotation: number) => {
    const currentNum = getCurrentNumber(rotation);
    const canonicalRotation = (360 - (currentNum * DEGREES_PER_NUMBER)) % 360;

    // Find the closest equivalent rotation to the current rotation
    // (accounting for multiple full rotations)
    const rotations = Math.round((rotation - canonicalRotation) / 360);
    const targetRotation = canonicalRotation + (rotations * 360);

    return targetRotation;
  };

  // Calculate angle from center to a point
  const getAngleFromCenter = (clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    return angle;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || readOnly || currentPosition >= length) return;
    setIsDragging(true);
    const angle = getAngleFromCenter(e.touches[0].clientX, e.touches[0].clientY);
    setLastAngle(angle);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || readOnly || currentPosition >= length) return;
    e.preventDefault();
    setIsDragging(true);
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    setLastAngle(angle);
  };

  // Document-level touch move handler
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (disabled) return;
      e.preventDefault(); // Prevent page scrolling while dragging
      const currentAngle = getAngleFromCenter(e.touches[0].clientX, e.touches[0].clientY);
      const deltaAngle = currentAngle - lastAngle;
      setDialRotation(prev => prev + deltaAngle);
      setLastAngle(currentAngle);
    };

    const handleTouchEnd = () => {
      if (currentPosition >= length) return;
      setIsDragging(false);

      // Snap to nearest number and select it
      const snappedRotation = snapToNearestNumber(dialRotation);
      setDialRotation(snappedRotation);
      const selectedNum = getCurrentNumber(snappedRotation);

      const newNumbers = [...selectedNumbers];
      newNumbers[currentPosition] = selectedNum;
      setSelectedNumbers(newNumbers);
      setCurrentPosition(prev => prev + 1);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, disabled, lastAngle, dialRotation, currentPosition, length, selectedNumbers]);

  // Document-level mouse move handler
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (disabled) return;
      const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
      const deltaAngle = currentAngle - lastAngle;
      setDialRotation(prev => prev + deltaAngle);
      setLastAngle(currentAngle);
    };

    const handleMouseUp = () => {
      if (currentPosition >= length) return;
      setIsDragging(false);

      // Snap to nearest number and select it
      const snappedRotation = snapToNearestNumber(dialRotation);
      setDialRotation(snappedRotation);
      const selectedNum = getCurrentNumber(snappedRotation);

      const newNumbers = [...selectedNumbers];
      newNumbers[currentPosition] = selectedNum;
      setSelectedNumbers(newNumbers);
      setCurrentPosition(prev => prev + 1);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, disabled, lastAngle, dialRotation, currentPosition, length, selectedNumbers]);

  const handleSubmit = () => {
    if (disabled || currentPosition < length) return;
    const answer = selectedNumbers.filter((n): n is number => n !== null);
    onSubmit(answer);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedNumbers(Array(length).fill(null));
    setCurrentPosition(0);
    setDialRotation(0);
  };

  const currentNumber = getCurrentNumber(dialRotation);
  const isComplete = currentPosition >= length;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Selected numbers display */}
      <div className="flex gap-2">
        {selectedNumbers.map((num, index) => (
          <div
            key={index}
            className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 font-bold text-2xl font-mono ${
              index === currentPosition
                ? 'border-primary bg-primary/10'
                : num !== null
                ? 'border-green-500 bg-green-500/10 text-foreground'
                : 'border-muted bg-muted/10 text-muted-foreground'
            }`}
          >
            {num !== null ? num.toString().padStart(2, '0') : '––'}
          </div>
        ))}
      </div>

      {/* Safe dial */}
      <div className="relative">
        <div
          ref={dialRef}
          className={`relative w-72 h-72 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shadow-2xl ${
            disabled || isComplete ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          style={{
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.2)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
          }}
        >
          {/* Center circle */}
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner flex items-center justify-center">
            <div className="text-5xl font-bold font-mono text-foreground">
              {currentNumber.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Rotating tick marks and numbers */}
          <div
            className="absolute inset-0 transition-transform"
            style={{
              transform: `rotate(${dialRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {NUMBERS.map((num) => {
              const angle = (num * DEGREES_PER_NUMBER) - 90;
              const radian = (angle * Math.PI) / 180;
              const radius = 130;
              // Round to 2 decimal places to prevent hydration mismatches
              const x = Math.round(Math.cos(radian) * radius * 100) / 100;
              const y = Math.round(Math.sin(radian) * radius * 100) / 100;

              // Show number label every 10
              const showLabel = num % 10 === 0;
              // Three sizes of tick marks
              const isMajorTick = num % 10 === 0; // 0, 10, 20, etc.
              const isMidTick = num % 5 === 0 && num % 10 !== 0; // 5, 15, 25, etc.

              return (
                <div key={num}>
                  {/* Tick mark */}
                  <div
                    className={`absolute ${
                      isMajorTick
                        ? 'w-0.5 h-4 bg-foreground/60'
                        : isMidTick
                        ? 'w-0.5 h-3 bg-foreground/50'
                        : 'w-0.5 h-2 bg-foreground/30'
                    }`}
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${num * DEGREES_PER_NUMBER}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                  {/* Number label (only for multiples of 10) */}
                  {showLabel && (
                    <div
                      className="absolute text-lg font-bold font-mono text-foreground/80"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x * 0.75}px), calc(-50% + ${y * 0.75}px)) rotate(${-dialRotation}deg)`,
                      }}
                    >
                      {num}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Top marker (shows which number is selected) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-6 bg-primary shadow-lg"></div>
        </div>
      </div>

      {/* Control buttons */}
      {!readOnly && (
        <div className="flex gap-3 w-full max-w-xs justify-center">
          <Button
            onClick={handleReset}
            disabled={disabled || currentPosition === 0}
            variant="outline"
            className="w-auto px-8"
          >
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disabled || !isComplete}
            size="lg"
            variant="secondary"
            className="w-auto px-12"
          >
            {disabled ? 'Checking...' : isComplete ? 'Submit' : `${currentPosition}/${length} Complete`}
          </Button>
        </div>
      )}
    </div>
  );
}
