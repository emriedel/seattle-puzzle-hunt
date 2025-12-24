'use client';

import { useState } from 'react';
import { Button } from './ui/button';

export interface ColorConfig {
  code: string;        // Custom code for this color (e.g., "R", "1", "A")
  color: string;       // Predefined name OR hex code (e.g., "Red" or "#ef4444")
  label: string;       // Display label for accessibility
}

interface ColorCodeInputProps {
  colors: ColorConfig[];  // Array of 2-12+ colors (grid adjusts dynamically)
  maxLength?: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

// Predefined color palette (supports both name and hex code input)
const PREDEFINED_COLORS: Record<string, { base: string; hover: string; active: string }> = {
  Red: {
    base: 'bg-red-500',
    hover: 'hover:bg-red-600',
    active: 'active:bg-red-700',
  },
  Blue: {
    base: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    active: 'active:bg-blue-700',
  },
  Green: {
    base: 'bg-green-500',
    hover: 'hover:bg-green-600',
    active: 'active:bg-green-700',
  },
  Yellow: {
    base: 'bg-yellow-500',
    hover: 'hover:bg-yellow-600',
    active: 'active:bg-yellow-700',
  },
  Orange: {
    base: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    active: 'active:bg-orange-700',
  },
  Purple: {
    base: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    active: 'active:bg-purple-700',
  },
  Pink: {
    base: 'bg-pink-500',
    hover: 'hover:bg-pink-600',
    active: 'active:bg-pink-700',
  },
  White: {
    base: 'bg-white',
    hover: 'hover:bg-gray-100',
    active: 'active:bg-gray-200',
  },
  Black: {
    base: 'bg-black',
    hover: 'hover:bg-gray-800',
    active: 'active:bg-gray-900',
  },
  Brown: {
    base: 'bg-amber-700',
    hover: 'hover:bg-amber-800',
    active: 'active:bg-amber-900',
  },
};

// Helper function to lighten/darken a hex color
function adjustHexBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (val: number) => {
    const adjusted = Math.round(val * (1 + percent / 100));
    return Math.max(0, Math.min(255, adjusted));
  };

  // Convert back to hex
  const toHex = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

// Determine if a color is light (for text contrast)
function isLightColor(hex: string): boolean {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export default function ColorCodeInput({
  colors,
  maxLength,
  onSubmit,
  disabled,
}: ColorCodeInputProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);

  // Determine grid columns based on number of colors
  const getGridColumns = (colorCount: number): number => {
    if (colorCount <= 4) return 2;      // 2-4 colors: 2 columns
    if (colorCount <= 9) return 3;      // 5-9 colors: 3 columns
    return 4;                           // 10+ colors: 4 columns
  };

  const gridColumns = getGridColumns(colors.length);

  const addColor = (colorCode: string, index: number) => {
    if (disabled) return;
    if (maxLength && sequence.length >= maxLength) return;

    // Visual feedback - flash the button
    setFlashingIndex(index);
    setTimeout(() => setFlashingIndex(null), 200);

    setSequence([...sequence, colorCode]);
  };

  const handleReset = () => {
    if (disabled) return;
    setSequence([]);
  };

  const handleSubmit = () => {
    if (disabled || sequence.length === 0) return;
    // Convert to compressed string (e.g., ['R', 'W', 'O', 'P'] => "RWOP")
    const answer = sequence.join('');
    onSubmit(answer);
  };

  // Helper to get color styles
  const getColorStyles = (colorConfig: ColorConfig) => {
    const { color } = colorConfig;

    // Check if it's a predefined color
    if (PREDEFINED_COLORS[color]) {
      return {
        type: 'tailwind' as const,
        base: PREDEFINED_COLORS[color].base,
        hover: PREDEFINED_COLORS[color].hover,
        active: PREDEFINED_COLORS[color].active,
        textColor: color === 'White' ? 'text-gray-800' : 'text-white',
      };
    }

    // Otherwise, treat as hex code
    const baseColor = color.startsWith('#') ? color : `#${color}`;
    return {
      type: 'hex' as const,
      base: baseColor,
      hover: adjustHexBrightness(baseColor, -10),
      active: adjustHexBrightness(baseColor, -20),
      textColor: isLightColor(baseColor) ? '#1f2937' : '#ffffff',
    };
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-md mx-auto">
      {/* Sequence display */}
      <div className="min-h-16 p-4 rounded-lg border-2 border-muted bg-muted/10 flex items-center justify-center flex-wrap gap-2 w-full">
        {sequence.length === 0 ? (
          <span className="text-muted-foreground italic">Tap colors below...</span>
        ) : (
          sequence.map((code, index) => {
            // Find the color config for this code
            const colorConfig = colors.find(c => c.code === code);
            if (!colorConfig) return null;

            const styles = getColorStyles(colorConfig);

            return (
              <div
                key={index}
                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                  styles.type === 'tailwind' ? styles.base : ''
                }`}
                style={styles.type === 'hex' ? { backgroundColor: styles.base } : undefined}
                title={colorConfig.label}
              />
            );
          })
        )}
      </div>

      {/* Color buttons grid (dynamic columns based on color count) */}
      <div
        className={`grid gap-3 w-auto ${
          gridColumns === 2 ? 'grid-cols-2' :
          gridColumns === 3 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}
      >
        {colors.map((colorConfig, index) => {
          const styles = getColorStyles(colorConfig);
          const isFlashing = flashingIndex === index;

          return (
            <Button
              key={index}
              onClick={() => addColor(colorConfig.code, index)}
              disabled={disabled || (maxLength ? sequence.length >= maxLength : false)}
              size="lg"
              variant="outline"
              className={`
                h-20 w-20
                ${styles.type === 'tailwind' ? `${styles.base} ${styles.hover} ${styles.active}` : ''}
                border-0
                ${isFlashing ? 'scale-95 brightness-125' : 'scale-100'}
                transition-all duration-200
              `}
              style={
                styles.type === 'hex'
                  ? {
                      backgroundColor: styles.base,
                      color: styles.textColor,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (styles.type === 'hex') {
                  e.currentTarget.style.backgroundColor = styles.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (styles.type === 'hex') {
                  e.currentTarget.style.backgroundColor = styles.base;
                }
              }}
              onMouseDown={(e) => {
                if (styles.type === 'hex') {
                  e.currentTarget.style.backgroundColor = styles.active;
                }
              }}
              onMouseUp={(e) => {
                if (styles.type === 'hex') {
                  e.currentTarget.style.backgroundColor = styles.hover;
                }
              }}
              aria-label={colorConfig.label}
            >
              {/* No icon - just solid color */}
            </Button>
          );
        })}
      </div>

      {/* Reset and Submit buttons */}
      <div className="flex gap-3 w-full max-w-xs justify-center">
        <Button
          onClick={handleReset}
          disabled={disabled || sequence.length === 0}
          variant="outline"
          className="w-auto px-8"
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={disabled || sequence.length === 0}
          size="lg"
          className="w-auto px-12 bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Checking...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
