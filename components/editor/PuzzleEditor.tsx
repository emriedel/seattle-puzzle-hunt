'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ColorConfig {
  code: string;
  color: string;
  label: string;
}

interface PuzzleData {
  type: string;
  answer: string | number[];
  answer_length: number;
  colors?: ColorConfig[];
  images?: string[];
  image?: string;
}

interface PuzzleEditorProps {
  puzzle: PuzzleData;
  onChange: (puzzle: PuzzleData) => void;
}

const PUZZLE_TYPES = [
  { value: 'number_code.cryptex', label: 'Number Cryptex' },
  { value: 'number_code.safe', label: 'Safe Dial' },
  { value: 'word_code', label: 'Letter Cryptex' },
  { value: 'tile_word', label: 'Tile Word Builder' },
  { value: 'tile_image', label: 'Image Tile Builder' },
  { value: 'directional_code', label: 'Directional Pad' },
  { value: 'color_code', label: 'Color Code' },
  { value: 'simon_code', label: 'Simon Code (Legacy)' },
  { value: 'morse_code', label: 'Morse Code Tap' },
  { value: 'toggle_code', label: 'Toggle Switches' },
  { value: 'slide_puzzle', label: 'Slide Puzzle' },
];

export function PuzzleEditor({ puzzle, onChange }: PuzzleEditorProps) {
  const updateField = (field: keyof PuzzleData, value: any) => {
    onChange({
      ...puzzle,
      [field]: value,
    });
  };

  const isSafePuzzle = puzzle.type === 'number_code.safe';
  const isColorCode = puzzle.type === 'color_code';
  const isTileImage = puzzle.type === 'tile_image';
  const isSlidePuzzle = puzzle.type === 'slide_puzzle';

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50 text-slate-900">
      <h3 className="font-semibold text-lg">Puzzle Configuration</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="puzzle-type">Puzzle Type</Label>
          <Select
            value={puzzle.type}
            onValueChange={(value) => updateField('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUZZLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="puzzle-answer-length">Answer Length</Label>
          <Input
            id="puzzle-answer-length"
            type="number"
            value={puzzle.answer_length}
            onChange={(e) => updateField('answer_length', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="puzzle-answer">
          Answer {isSafePuzzle ? '(comma-separated numbers for safe dial, e.g., "15,30,45")' : ''}
        </Label>
        <Input
          id="puzzle-answer"
          value={Array.isArray(puzzle.answer) ? puzzle.answer.join(',') : puzzle.answer}
          onChange={(e) => {
            if (isSafePuzzle) {
              // Parse comma-separated numbers for safe dial
              const numbers = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
              updateField('answer', numbers);
            } else {
              updateField('answer', e.target.value);
            }
          }}
          placeholder={isSafePuzzle ? '15,30,45' : 'BOOK or 1234'}
        />
      </div>

      {isSlidePuzzle && (
        <div>
          <Label htmlFor="puzzle-image">Image Path</Label>
          <Input
            id="puzzle-image"
            value={puzzle.image || ''}
            onChange={(e) => updateField('image', e.target.value)}
            placeholder="/puzzle-images/your-image.jpg"
          />
        </div>
      )}

      {isTileImage && (
        <div>
          <Label>Image Paths (one per line)</Label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            value={(puzzle.images || []).join('\n')}
            onChange={(e) => {
              const images = e.target.value.split('\n').filter(line => line.trim());
              updateField('images', images);
            }}
            placeholder="/puzzle-images/step1.svg&#10;/puzzle-images/step2.svg&#10;/puzzle-images/step3.svg"
          />
        </div>
      )}

      {isColorCode && (
        <div>
          <Label>Colors (JSON array - optional)</Label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md font-mono text-sm"
            value={puzzle.colors ? JSON.stringify(puzzle.colors, null, 2) : ''}
            onChange={(e) => {
              try {
                const colors = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                updateField('colors', colors);
              } catch (error) {
                // Invalid JSON - don't update
              }
            }}
            placeholder='[{"code":"R","color":"Red","label":"Red"},{"code":"G","color":"Green","label":"Green"}]'
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty for default colors (R, G, B, Y)
          </p>
        </div>
      )}
    </div>
  );
}
