'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SlidePuzzleInputProps {
  imagePath: string;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

// Tile positions: 0-8, where 8 is the empty space
type TilePosition = number[];

const SOLVED_STATE = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const SCRAMBLE_MOVES = 25; // 20-30 range

export default function SlidePuzzleInput({
  imagePath,
  onSubmit,
  disabled = false,
}: SlidePuzzleInputProps) {
  const [tiles, setTiles] = useState<TilePosition>(SOLVED_STATE);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [hasStarted, setHasStarted] = useState(false);

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

    // Swap clicked tile with empty space
    const newTiles = [...tiles];
    [newTiles[emptyIndex], newTiles[clickedIndex]] =
      [newTiles[clickedIndex], newTiles[emptyIndex]];

    setTiles(newTiles);
    setEmptyIndex(clickedIndex);

    // Check if solved
    if (isSolved(newTiles)) {
      setTimeout(() => {
        onSubmit('SOLVED');
      }, 500); // Small delay to show final animation
    }
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

    return {
      backgroundImage: `url(${imagePath})`,
      backgroundSize: '300%',
      backgroundPosition: `${-col * 100}% ${-row * 100}%`,
      position: 'absolute' as const,
      width: `calc(${tilePercent}% - ${gapPercent}%)`,
      height: `calc(${tilePercent}% - ${gapPercent}%)`,
      left: `calc(${currentCol * tilePercent}% + ${currentCol * gapPercent / 3}%)`,
      top: `calc(${currentRow * tilePercent}% + ${currentRow * gapPercent / 3}%)`,
      transition: 'left 0.3s ease-in-out, top 0.3s ease-in-out',
      zIndex: 1,
      willChange: 'left, top',
    };
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-4">
      {/* Puzzle Grid */}
      <div className="relative w-full aspect-square bg-gray-300 p-1 rounded-lg">
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
                style={getTileStyle(tileValue, index)}
                aria-label={`Tile ${tileValue + 1}`}
              >
                {/* Optional: show tile number for debugging */}
                {/* <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-1">
                  {tileValue}
                </div> */}
              </button>
            );
          })}

        {/* Empty space - invisible but shows where the gap is */}
        <div
          className="absolute rounded bg-gray-400/20 pointer-events-none"
          style={{
            width: `calc(33.333% - 0.333%)`,
            height: `calc(33.333% - 0.333%)`,
            left: `calc(${(emptyIndex % 3) * 33.666}% + ${(emptyIndex % 3) * 0.25}%)`,
            top: `calc(${Math.floor(emptyIndex / 3) * 33.666}% + ${Math.floor(emptyIndex / 3) * 0.25}%)`,
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={handleReset}
          disabled={disabled}
          variant="outline"
          className="flex-1"
        >
          Reset Puzzle
        </Button>
      </div>

      {/* Solved indicator */}
      {isSolved(tiles) && (
        <div className="text-center text-green-600 font-semibold animate-pulse">
          Puzzle Solved!
        </div>
      )}
    </Card>
  );
}
