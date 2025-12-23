'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RawTextEditor, { RawTextEditorHandle } from '@/components/editor/RawTextEditor';

interface HuntMetadata {
  id: string;
  title: string;
  neighborhood: string;
  description?: string;
  hunt_intro_text?: string;
  hunt_success_text?: string;
  estimated_time_minutes: number;
  global_location_radius_meters?: number;
}

interface HuntMetadataFormProps {
  metadata: HuntMetadata;
  onChange: (metadata: HuntMetadata) => void;
  onFieldFocus?: (field: string, element?: HTMLElement) => void;
  editorRefs?: React.MutableRefObject<Map<string, RawTextEditorHandle>>;
}

export function HuntMetadataForm({ metadata, onChange, onFieldFocus, editorRefs }: HuntMetadataFormProps) {
  const introEditorRef = useRef<RawTextEditorHandle>(null);
  const successEditorRef = useRef<RawTextEditorHandle>(null);

  // Register editor refs
  useEffect(() => {
    if (editorRefs) {
      if (introEditorRef.current) {
        editorRefs.current.set('hunt_intro', introEditorRef.current);
      }
      if (successEditorRef.current) {
        editorRefs.current.set('hunt_success', successEditorRef.current);
      }
    }
  }, [editorRefs]);

  const updateField = (field: keyof HuntMetadata, value: any) => {
    onChange({
      ...metadata,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hunt Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hunt-id">Hunt ID</Label>
            <Input
              id="hunt-id"
              value={metadata.id}
              onChange={(e) => updateField('id', e.target.value)}
              placeholder="fremont_hidden_corners"
            />
          </div>

          <div>
            <Label htmlFor="hunt-title">Title</Label>
            <Input
              id="hunt-title"
              value={metadata.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Fremont's Hidden Corners"
            />
          </div>

          <div>
            <Label htmlFor="hunt-neighborhood">Neighborhood</Label>
            <Input
              id="hunt-neighborhood"
              value={metadata.neighborhood}
              onChange={(e) => updateField('neighborhood', e.target.value)}
              placeholder="Fremont"
            />
          </div>

          <div>
            <Label htmlFor="hunt-time">Estimated Time (minutes)</Label>
            <Input
              id="hunt-time"
              type="number"
              value={metadata.estimated_time_minutes}
              onChange={(e) => updateField('estimated_time_minutes', parseInt(e.target.value) || 0)}
              placeholder="90"
            />
          </div>

          <div>
            <Label htmlFor="hunt-radius">GPS Radius (meters)</Label>
            <Input
              id="hunt-radius"
              type="number"
              value={metadata.global_location_radius_meters || 40}
              onChange={(e) => updateField('global_location_radius_meters', parseInt(e.target.value) || 40)}
              placeholder="40"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="hunt-description">Description</Label>
          <Textarea
            id="hunt-description"
            value={metadata.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="A short description of the hunt"
            rows={2}
          />
        </div>

        <div>
          <Label>Hunt Intro Text (supports formatting)</Label>
          <RawTextEditor
            ref={introEditorRef}
            value={metadata.hunt_intro_text || ''}
            onChange={(value) => updateField('hunt_intro_text', value)}
            onFocus={(element) => onFieldFocus?.('hunt_intro', element)}
          />
        </div>

        <div>
          <Label>Hunt Success Text (supports formatting)</Label>
          <RawTextEditor
            ref={successEditorRef}
            value={metadata.hunt_success_text || ''}
            onChange={(value) => updateField('hunt_success_text', value)}
            onFocus={(element) => onFieldFocus?.('hunt_success', element)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
