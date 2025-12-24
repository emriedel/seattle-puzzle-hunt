'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SlidePuzzleInputProps {
  imagePath: string;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  showReset?: boolean; // Only show reset button on test page
}

// Tile positions: 0-8, where 8 is the empty space
type TilePosition = number[];

const SOLVED_STATE = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const SCRAMBLE_MOVES = 30;

export default function SlidePuzzleInput({
  imagePath,
  onSubmit,
  disabled = false,
  showReset = false,
}: SlidePuzzleInputProps) {
  const [tiles, setTiles] = useState<TilePosition>(SOLVED_STATE);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [hasStarted, setHasStarted] = useState(false);
  const [movingTile, setMovingTile] = useState<number | null>(null);

  // Get row and column from index (0-8)
  const getRowCol = (index: number) => ({
    row: Math.floor(index / 3),
    col: index % 3,
  });

  // Check if two positions are adjacent
  const isAdjacent = (index1: number, index2: number) => {
    const pos1 = getRowCol(index1);
    const pos2 = getRowCol(index2);
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // Get valid adjacent positions to empty space
  const getValidMoves = (emptyPos: number) => {
    const moves: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (isAdjacent(i, emptyPos)) {
        moves.push(i);
      }
    }
    return moves;
  };

  // Check if puzzle is solved
  const isSolved = (currentTiles: TilePosition) => {
    return currentTiles.every((tile, index) => tile === SOLVED_STATE[index]);
  };

  // Count inversions for solvability check
  const countInversions = (arr: number[]) => {
    let inversions = 0;
    const filtered = arr.filter((x) => x !== 8); // Exclude empty space
    for (let i = 0; i < filtered.length - 1; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) {
          inversions++;
        }
      }
    }
    return inversions;
  };

  // Check if configuration is solvable (for 3x3, even inversions = solvable)
  const isSolvable = (arr: number[]) => {
    return countInversions(arr) % 2 === 0;
  };

  // Scramble the puzzle with valid random moves
  const scramblePuzzle = useCallback(() => {
    let currentTiles = [...SOLVED_STATE];
    let currentEmpty = 8;

    for (let i = 0; i < SCRAMBLE_MOVES; i++) {
      const validMoves = getValidMoves(currentEmpty);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

      // Swap
      [currentTiles[currentEmpty], currentTiles[randomMove]] =
        [currentTiles[randomMove], currentTiles[currentEmpty]];
      currentEmpty = randomMove;
    }

    // Verify it's solvable (should always be with valid moves)
    if (!isSolvable(currentTiles)) {
      console.warn('Generated unsolvable puzzle, regenerating...');
      return scramblePuzzle();
    }

    setTiles(currentTiles);
    setEmptyIndex(currentEmpty);
    setHasStarted(true);
  }, []);

  // Initialize puzzle on mount
  useEffect(() => {
    if (!hasStarted) {
      scramblePuzzle();
    }
  }, [hasStarted, scramblePuzzle]);

  // Handle tile click
  const handleTileClick = (clickedIndex: number) => {
    if (disabled || clickedIndex === emptyIndex) return;
    if (!isAdjacent(clickedIndex, emptyIndex)) return;

    // Track which tile is moving for higher z-index
    const clickedTileValue = tiles[clickedIndex];

    // Debug logging
    const fromRow = Math.floor(clickedIndex / 3);
    const toRow = Math.floor(emptyIndex / 3);
    const direction = toRow > fromRow ? 'DOWN' : toRow < fromRow ? 'UP' : fromRow === toRow && (emptyIndex % 3) > (clickedIndex % 3) ? 'RIGHT' : 'LEFT';
    console.log(`Moving tile ${clickedTileValue + 1} ${direction}: from index ${clickedIndex} to ${emptyIndex}`);

    // Prepare the new tile positions
    const newTiles = [...tiles];
    [newTiles[emptyIndex], newTiles[clickedIndex]] =
      [newTiles[clickedIndex], newTiles[emptyIndex]];

    // Set moving tile for higher z-index
    setMovingTile(clickedTileValue);

    // Use double requestAnimationFrame to ensure browser paints current state
    // before applying new positions (forces reflow)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTiles(newTiles);
        setEmptyIndex(clickedIndex);
      });
    });

    // Clear moving tile after animation completes
    setTimeout(() => {
      setMovingTile(null);
    }, 300);
  };

  // Reset puzzle
  const handleReset = () => {
    scramblePuzzle();
  };

  // Get background position for each tile (based on tile value, not position)
  const getTileStyle = (tileValue: number, currentIndex: number) => {
    if (tileValue === 8) return {}; // Empty tile

    // Background position based on the tile's VALUE (which section of image)
    const row = Math.floor(tileValue / 3);
    const col = tileValue % 3;

    // Current position in grid
    const currentRow = Math.floor(currentIndex / 3);
    const currentCol = currentIndex % 3;

    // Calculate exact pixel positions more reliably
    const tilePercent = 100 / 3; // 33.333...%
    const gapPercent = 0.25; // Small gap percentage

    // Give moving tile higher z-index to ensure it's visible during animation
    const isMoving = tileValue === movingTile;

    return {
      backgroundImage: `url(${imagePath})`,
      backgroundSize: '300%',
      backgroundPosition: `${-col * 100}% ${-row * 100}%`,
      position: 'absolute' as const,
      width: `calc(${tilePercent}% - ${gapPercent}%)`,
      height: `calc(${tilePercent}% - ${gapPercent}%)`,
      left: `calc(${currentCol * tilePercent}% + ${currentCol * gapPercent / 3}%)`,
      top: `calc(${currentRow * tilePercent}% + ${currentRow * gapPercent / 3}%)`,
      zIndex: isMoving ? 10 : 1,
    };
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-4">
      {/* Puzzle Grid */}
      <div
        className="relative w-full aspect-square bg-gray-300 p-1 rounded-lg"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Render only the 8 actual tiles (not the empty space) */}
        {tiles
          .map((tileValue, index) => ({ tileValue, index }))
          .filter(({ tileValue }) => tileValue !== 8)
          .map(({ tileValue, index }) => {
            const isClickable = isAdjacent(index, emptyIndex) && !disabled;

            return (
              <button
                key={tileValue}
                onClick={() => handleTileClick(index)}
                disabled={!isClickable}
                className={`
                  rounded overflow-hidden bg-white
                  ${isClickable ? 'cursor-pointer hover:brightness-110 shadow-md hover:shadow-lg' : 'cursor-default'}
                `}
                style={{
                  ...getTileStyle(tileValue, index),
                  transition: hasStarted ? 'left 0.3s ease-in-out, top 0.3s ease-in-out' : 'none',
                }}
                aria-label={`Tile ${tileValue + 1}`}
              >
              </button>
            );
          })}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {showReset && (
          <Button
            onClick={handleReset}
            disabled={disabled}
            variant="outline"
            className="flex-1"
          >
            Reset Puzzle
          </Button>
        )}
        <Button
          onClick={() => onSubmit('SOLVED')}
          disabled={disabled}
          size="lg"
          className={`${showReset ? 'flex-1' : 'w-full'} bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {disabled ? 'Checking...' : 'Submit'}
        </Button>
      </div>
    </Card>
  );
}
