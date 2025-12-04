'use client';

import { useState, useEffect } from 'react';
import { isDebugMode, setDebugMode, setDebugLocation, getDebugLocation } from '@/lib/debug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface DebugPanelProps {
  locations?: Location[];
}

export default function DebugPanel({ locations = [] }: DebugPanelProps) {
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDebugLoc, setCurrentDebugLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setDebugEnabled(isDebugMode());
    setCurrentDebugLoc(getDebugLocation());
  }, []);

  const toggleDebug = () => {
    const newState = !debugEnabled;
    setDebugEnabled(newState);
    setDebugMode(newState);
    if (!newState) {
      setCurrentDebugLoc(null);
    }
  };

  const simulateLocation = (loc: Location) => {
    setDebugLocation({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setCurrentDebugLoc({ lat: loc.lat, lng: loc.lng });
  };

  const clearLocation = () => {
    setDebugLocation(null);
    setCurrentDebugLoc(null);
  };

  if (!debugEnabled && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className="fixed bottom-4 right-4 shadow-lg z-50 font-mono"
      >
        🐛 Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 shadow-xl max-w-sm z-50 border-purple-500/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            🐛 Debug Mode
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={debugEnabled}
            onChange={toggleDebug}
            className="rounded"
          />
          Enable Debug Mode
        </label>

        {debugEnabled && (
          <>
            {currentDebugLoc && (
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs space-y-1">
                <div className="font-semibold">Simulating Location:</div>
                <div>Lat: {currentDebugLoc.lat.toFixed(4)}</div>
                <div>Lng: {currentDebugLoc.lng.toFixed(4)}</div>
                <Button
                  onClick={clearLocation}
                  variant="destructive"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}

            {locations.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-2">Simulate Being At:</div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {locations.map((loc) => (
                    <Button
                      key={loc.id}
                      onClick={() => simulateLocation(loc)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-2 text-xs"
                    >
                      <div className="text-left w-full">
                        <div>{loc.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-3 border-t text-[10px] text-muted-foreground">
          Add ?debug=true to URL to enable
        </div>
      </CardContent>
    </Card>
  );
}
