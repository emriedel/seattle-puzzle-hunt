'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface HuntSummary {
  id: string;
  title: string;
  neighborhood: string;
  filename: string;
}

interface HuntSelectorProps {
  onHuntSelected: (hunt: any, filename: string) => void;
  onNewHunt: () => void;
}

export function HuntSelector({ onHuntSelected, onNewHunt }: HuntSelectorProps) {
  const [hunts, setHunts] = useState<HuntSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHuntId, setSelectedHuntId] = useState<string>('');

  useEffect(() => {
    fetchHunts();
  }, []);

  const fetchHunts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/editor/hunts');
      const data = await response.json();
      setHunts(data.hunts || []);
    } catch (error) {
      console.error('Failed to fetch hunts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHunt = async (huntId: string) => {
    setSelectedHuntId(huntId);

    try {
      const response = await fetch(`/api/editor/hunts/${huntId}`);
      const data = await response.json();

      if (data.hunt && data.filename) {
        onHuntSelected(data.hunt, data.filename);
      }
    } catch (error) {
      console.error('Failed to load hunt:', error);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Hunt to Edit
        </label>
        <Select
          value={selectedHuntId}
          onValueChange={handleSelectHunt}
          disabled={loading}
        >
          <SelectTrigger className="w-full bg-white text-slate-900">
            <SelectValue placeholder={loading ? 'Loading hunts...' : 'Choose a hunt'} />
          </SelectTrigger>
          <SelectContent>
            {hunts.map((hunt) => (
              <SelectItem key={hunt.id} value={hunt.id}>
                {hunt.title} ({hunt.neighborhood})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button variant="outline" onClick={onNewHunt}>
          New Hunt
        </Button>
      </div>
    </div>
  );
}
