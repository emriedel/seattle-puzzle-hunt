'use client';

import { useState, useRef, useEffect } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface SafeDialInputProps {
  length: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  initialValue?: string;
  readOnly?: boolean;
}

export default function SafeDialInput({ length, onSubmit, disabled, initialValue, readOnly }: SafeDialInputProps) {
  // Initialize with initialValue if provided
  const [selectedDigits, setSelectedDigits] = useState<string[]>(() => {
    if (initialValue) {
      return initialValue.padStart(length, '0').split('').slice(0, length);
    }
    return Array(length).fill('');
  });
  const [currentPosition, setCurrentPosition] = useState(() => initialValue ? length : 0); // Which digit we're selecting (0 to length-1)
  const [dialRotation, setDialRotation] = useState(0); // Current rotation angle in degrees
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const [rotationDirection, setRotationDirection] = useState<'cw' | 'ccw' | null>(null);

  const dialRef = useRef<HTMLDivElement>(null);

  // Expected direction alternates: clockwise for 0, 2, 4... and counter-clockwise for 1, 3, 5...
  const expectedDirection = currentPosition % 2 === 0 ? 'cw' : 'ccw';

  // Get the digit currently at the top (0 degrees) based on rotation
  const getCurrentDigit = (rotation: number) => {
    // Normalize rotation to 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    // Each digit is 36 degrees apart (360 / 10)
    // When we rotate clockwise (positive), higher digits move away and lower digits come to top
    // So we need to invert: 360 - rotation
    const digitIndex = Math.round((360 - normalizedRotation) / 36) % 10;
    return DIGITS[digitIndex];
  };

  // Calculate angle from center to a point
  const getAngleFromCenter = (clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    // atan2 returns angle in radians, convert to degrees
    // Adjust so 0 degrees is at top
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
      const currentAngle = getAngleFromCenter(e.touches[0].clientX, e.touches[0].clientY);
      const deltaAngle = currentAngle - lastAngle;

      // Detect direction
      if (Math.abs(deltaAngle) > 0.5) {
        setRotationDirection(deltaAngle > 0 ? 'cw' : 'ccw');
      }

      // Update rotation
      setDialRotation(prev => prev + deltaAngle);
      setLastAngle(currentAngle);
    };

    const handleTouchEnd = () => {
      if (currentPosition >= length) return;
      setIsDragging(false);

      // Select the current digit if we rotated in the correct direction
      if (rotationDirection === expectedDirection) {
        const digit = getCurrentDigit(dialRotation);
        const newDigits = [...selectedDigits];
        newDigits[currentPosition] = digit;
        setSelectedDigits(newDigits);
        setCurrentPosition(prev => prev + 1);
      }

      setRotationDirection(null);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, disabled, lastAngle, rotationDirection, expectedDirection, dialRotation, currentPosition, length, selectedDigits]);

  // Document-level mouse move handler
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (disabled) return;
      const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
      const deltaAngle = currentAngle - lastAngle;

      // Detect direction
      if (Math.abs(deltaAngle) > 0.5) {
        setRotationDirection(deltaAngle > 0 ? 'cw' : 'ccw');
      }

      setDialRotation(prev => prev + deltaAngle);
      setLastAngle(currentAngle);
    };

    const handleMouseUp = () => {
      if (currentPosition >= length) return;
      setIsDragging(false);

      // Select the current digit if we rotated in the correct direction
      if (rotationDirection === expectedDirection) {
        const digit = getCurrentDigit(dialRotation);
        const newDigits = [...selectedDigits];
        newDigits[currentPosition] = digit;
        setSelectedDigits(newDigits);
        setCurrentPosition(prev => prev + 1);
      }

      setRotationDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, disabled, lastAngle, rotationDirection, expectedDirection, dialRotation, currentPosition, length, selectedDigits]);

  // Scroll wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled || currentPosition >= length) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? 36 : -36; // Rotate by one digit
    setDialRotation(prev => prev + delta);
    setRotationDirection(e.deltaY > 0 ? 'cw' : 'ccw');
  };

  const handleSubmit = () => {
    if (disabled || currentPosition < length) return;
    const answer = selectedDigits.join('');
    onSubmit(answer);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedDigits(Array(length).fill(''));
    setCurrentPosition(0);
    setDialRotation(0);
    setRotationDirection(null);
  };

  const currentDigit = getCurrentDigit(dialRotation);
  const isComplete = currentPosition >= length;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Selected digits display */}
      <div className="flex gap-2">
        {selectedDigits.map((digit, index) => (
          <div
            key={index}
            className={`w-12 h-14 flex items-center justify-center rounded-lg border-2 font-bold text-2xl font-mono ${
              index === currentPosition
                ? 'border-primary bg-primary/10'
                : digit
                ? 'border-green-500 bg-green-500/10 text-foreground'
                : 'border-muted bg-muted/10 text-muted-foreground'
            }`}
          >
            {digit || '–'}
          </div>
        ))}
      </div>

      {/* Safe dial */}
      <div className="relative">
        {/* Dial container */}
        <div
          ref={dialRef}
          className={`relative w-64 h-64 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shadow-2xl ${
            disabled || isComplete ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.2)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* Center circle */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner flex items-center justify-center">
            <div className="text-4xl font-bold font-mono text-foreground">
              {currentDigit}
            </div>
          </div>

          {/* Rotating digits around perimeter */}
          <div
            className="absolute inset-0 transition-transform"
            style={{
              transform: `rotate(${dialRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {DIGITS.map((digit, index) => {
              const angle = (index * 36) - 90; // Start at top (0 at -90deg which is top)
              const radian = (angle * Math.PI) / 180;
              const radius = 110; // Distance from center
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;

              return (
                <div
                  key={digit}
                  className="absolute text-xl font-bold font-mono text-foreground/70"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${-dialRotation}deg)`,
                  }}
                >
                  {digit}
                </div>
              );
            })}
          </div>

          {/* Top marker (shows which digit is selected) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 bg-primary rotate-45 shadow-lg"></div>
        </div>

        {/* Expected direction indicator - always visible when not complete */}
        {!isComplete && !rotationDirection && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-primary/30">
            {expectedDirection === 'cw' ? (
              <RotateCw className="w-20 h-20" />
            ) : (
              <RotateCcw className="w-20 h-20" />
            )}
          </div>
        )}

        {/* Direction feedback indicator - shows when actively rotating */}
        {rotationDirection && !isComplete && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
            rotationDirection === expectedDirection ? 'text-green-500' : 'text-red-500'
          }`}>
            {rotationDirection === 'cw' ? (
              <RotateCw className="w-20 h-20 opacity-60" />
            ) : (
              <RotateCcw className="w-20 h-20 opacity-60" />
            )}
          </div>
        )}
      </div>

      {/* Control buttons - hide when readOnly */}
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

      {/* Instructions */}
      {!isComplete && !readOnly && (
        <div className="text-xs text-center text-muted-foreground max-w-xs">
          Drag the dial {expectedDirection === 'cw' ? 'clockwise' : 'counter-clockwise'} to select digit {currentPosition + 1}.
          Release when your desired number is at the top marker.
        </div>
      )}
    </div>
  );
}
