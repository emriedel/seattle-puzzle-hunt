'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface LocationData {
  id: string;
  name: string;
  address?: string;
  order: number;
  coordinates: { lat: number; lng: number };
  location_riddle: string;
  location_found_text: string;
  search_location_button_text?: string;
  puzzle: PuzzleData;
  next_location_id: string | null;
}

interface LocationListProps {
  locations: LocationData[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function LocationList({
  locations,
  selectedIndex,
  onSelect,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: LocationListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Locations</span>
          <Button size="sm" onClick={onAdd}>
            + Add Location
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No locations yet. Click "Add Location" to start.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((location, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedIndex === index
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => onSelect(index)}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {index + 1}. {location.name || 'Untitled Location'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {location.id} • {location.puzzle.type}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(index);
                    }}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(index);
                    }}
                    disabled={index === locations.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
