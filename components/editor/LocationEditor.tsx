'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import RawTextEditor, { RawTextEditorHandle } from '@/components/editor/RawTextEditor';
import { PuzzleEditor } from '@/components/editor/PuzzleEditor';

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

interface LocationEditorProps {
  location: LocationData;
  onChange: (location: LocationData) => void;
  availableLocationIds: string[];
  onFieldFocus?: (field: string, element?: HTMLElement) => void;
  editorRefs?: React.MutableRefObject<Map<string, RawTextEditorHandle>>;
  locationIndex: number;
}

export function LocationEditor({ location, onChange, availableLocationIds, onFieldFocus, editorRefs, locationIndex }: LocationEditorProps) {
  const riddleEditorRef = useRef<RawTextEditorHandle>(null);
  const foundTextEditorRef = useRef<RawTextEditorHandle>(null);

  // Register editor refs
  useEffect(() => {
    if (editorRefs) {
      if (riddleEditorRef.current) {
        editorRefs.current.set(`location_${locationIndex}_riddle`, riddleEditorRef.current);
      }
      if (foundTextEditorRef.current) {
        editorRefs.current.set(`location_${locationIndex}_found`, foundTextEditorRef.current);
      }
    }
  }, [editorRefs, locationIndex]);

  const updateField = (field: keyof LocationData, value: any) => {
    onChange({
      ...location,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location: {location.name || 'Untitled'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`location-id-${location.order}`}>Location ID</Label>
            <Input
              id={`location-id-${location.order}`}
              value={location.id}
              onChange={(e) => updateField('id', e.target.value)}
              placeholder="location-fremont-troll"
            />
          </div>

          <div>
            <Label htmlFor={`location-name-${location.order}`}>Name</Label>
            <Input
              id={`location-name-${location.order}`}
              value={location.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Fremont Troll"
            />
          </div>

          <div>
            <Label htmlFor={`location-order-${location.order}`}>Order</Label>
            <Input
              id={`location-order-${location.order}`}
              type="number"
              value={location.order}
              onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`location-address-${location.order}`}>Address</Label>
          <Input
            id={`location-address-${location.order}`}
            value={location.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="N 36th St, Seattle, WA 98103"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`location-lat-${location.order}`}>Latitude</Label>
            <Input
              id={`location-lat-${location.order}`}
              type="number"
              step="0.000001"
              value={location.coordinates.lat}
              onChange={(e) => updateField('coordinates', { ...location.coordinates, lat: parseFloat(e.target.value) || 0 })}
              placeholder="47.654321"
            />
          </div>

          <div>
            <Label htmlFor={`location-lng-${location.order}`}>Longitude</Label>
            <Input
              id={`location-lng-${location.order}`}
              type="number"
              step="0.000001"
              value={location.coordinates.lng}
              onChange={(e) => updateField('coordinates', { ...location.coordinates, lng: parseFloat(e.target.value) || 0 })}
              placeholder="-122.347654"
            />
          </div>
        </div>

        <Separator />

        {/* Location Riddle */}
        <div>
          <Label>Location Riddle (shown before arriving)</Label>
          <RawTextEditor
            ref={riddleEditorRef}
            value={location.location_riddle}
            onChange={(value) => updateField('location_riddle', value)}
            onFocus={(element) => onFieldFocus?.('location_riddle', element)}
          />
        </div>

        {/* Location Found Text */}
        <div>
          <Label>Location Found Text (puzzle instructions)</Label>
          <RawTextEditor
            ref={foundTextEditorRef}
            value={location.location_found_text}
            onChange={(value) => updateField('location_found_text', value)}
            onFocus={(element) => onFieldFocus?.('location_found', element)}
          />
        </div>

        {/* Optional Button Text */}
        <div>
          <Label htmlFor={`location-button-text-${location.order}`}>Search Location Button Text (optional)</Label>
          <Input
            id={`location-button-text-${location.order}`}
            value={location.search_location_button_text || ''}
            onChange={(e) => updateField('search_location_button_text', e.target.value)}
            placeholder="Search for clues"
          />
        </div>

        <Separator />

        {/* Puzzle Configuration */}
        <PuzzleEditor
          puzzle={location.puzzle}
          onChange={(puzzle) => updateField('puzzle', puzzle)}
        />

        <Separator />

        {/* Next Location */}
        <div>
          <Label htmlFor={`location-next-${location.order}`}>Next Location ID</Label>
          <Input
            id={`location-next-${location.order}`}
            value={location.next_location_id || ''}
            onChange={(e) => updateField('next_location_id', e.target.value || null)}
            placeholder="null for last location"
            list={`available-locations-${location.order}`}
          />
          <datalist id={`available-locations-${location.order}`}>
            {availableLocationIds.filter(id => id !== location.id).map(id => (
              <option key={id} value={id} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty for the final location
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
