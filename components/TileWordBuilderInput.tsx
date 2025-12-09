'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TileWordBuilderInputProps {
  tiles: string[]; // Available letter tiles
  slotCount?: number; // Number of answer slots (defaults to tiles.length)
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function TileWordBuilderInput({
  tiles,
  slotCount,
  onSubmit,
  disabled,
}: TileWordBuilderInputProps) {
  const answerSlots = slotCount || tiles.length;

  // Track which tiles are in which slots (null = empty slot)
  const [slots, setSlots] = useState<(string | null)[]>(Array(answerSlots).fill(null));

  // Track which tiles are still available in the pool
  const [availableTiles, setAvailableTiles] = useState<string[]>([...tiles]);

  const [draggedLetter, setDraggedLetter] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<'pool' | number | null>(null); // 'pool' or slot index

  const handleDragStart = (letter: string, source: 'pool' | number) => {
    if (disabled) return;
    setDraggedLetter(letter);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (disabled || !draggedLetter || dragSource === null) return;

    const newSlots = [...slots];
    const newAvailableTiles = [...availableTiles];

    // If dropping from pool
    if (dragSource === 'pool') {
      // If target slot is occupied, return that letter to pool
      if (newSlots[targetSlot]) {
        newAvailableTiles.push(newSlots[targetSlot]!);
      }

      // Remove letter from pool and place in slot
      const tileIndex = newAvailableTiles.indexOf(draggedLetter);
      if (tileIndex > -1) {
        newAvailableTiles.splice(tileIndex, 1);
      }
      newSlots[targetSlot] = draggedLetter;
    }
    // If dropping from another slot
    else if (typeof dragSource === 'number') {
      // Swap the letters
      const temp = newSlots[targetSlot];
      newSlots[targetSlot] = draggedLetter;
      newSlots[dragSource] = temp;
    }

    setSlots(newSlots);
    setAvailableTiles(newAvailableTiles);
    setDraggedLetter(null);
    setDragSource(null);
  };

  const handleDropToPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || !draggedLetter || dragSource === null) return;

    // Only allow dropping back to pool from a slot
    if (typeof dragSource === 'number') {
      const newSlots = [...slots];
      const newAvailableTiles = [...availableTiles];

      newSlots[dragSource] = null;
      newAvailableTiles.push(draggedLetter);

      setSlots(newSlots);
      setAvailableTiles(newAvailableTiles);
    }

    setDraggedLetter(null);
    setDragSource(null);
  };

  const resetTiles = () => {
    if (disabled) return;
    setSlots(Array(answerSlots).fill(null));
    setAvailableTiles([...tiles]);
  };

  const handleSubmit = () => {
    if (disabled) return;
    // Convert slots to answer string
    const answer = slots.filter(l => l !== null).join('');
    onSubmit(answer);
  };

  const isComplete = slots.every(slot => slot !== null);

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-2xl">
      {/* Answer slots */}
      <div className="w-full">
        <div className="flex gap-3 justify-center flex-wrap">
          {slots.map((letter, index) => (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                w-16 h-20 rounded-lg border-2 border-dashed
                flex items-center justify-center
                transition-colors
                ${letter
                  ? 'border-primary bg-primary/10'
                  : 'border-muted bg-muted/10'
                }
              `}
            >
              {letter ? (
                <div
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(letter, index)}
                  className="w-full h-full flex items-center justify-center cursor-move"
                >
                  <Card className="w-14 h-16 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-800">
                    <span className="text-3xl font-bold font-mono">{letter}</span>
                  </Card>
                </div>
              ) : (
                <span className="text-2xl text-muted-foreground/30 select-none">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tile pool */}
      <div className="w-full">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToPool}
          className="min-h-24 p-4 rounded-lg border-2 border-dashed border-muted bg-muted/5 flex items-center justify-center flex-wrap gap-3"
        >
          {availableTiles.length === 0 ? (
            <span className="text-muted-foreground italic">All tiles placed!</span>
          ) : (
            availableTiles.map((letter, index) => (
              <div
                key={`${letter}-${index}`}
                draggable={!disabled}
                onDragStart={() => handleDragStart(letter, 'pool')}
                className="cursor-move"
              >
                <Card className="w-14 h-16 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-800">
                  <span className="text-3xl font-bold font-mono">{letter}</span>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 w-full max-w-xs justify-center">
        <Button
          onClick={resetTiles}
          disabled={disabled || (slots.every(s => s === null) && availableTiles.length === tiles.length)}
          variant="outline"
          className="w-auto px-8"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
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
    </div>
  );
}
