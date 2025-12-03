'use client';

import { useState, useEffect } from 'react';
import { isDebugMode, setDebugMode, setDebugLocation, getDebugLocation } from '@/lib/debug';

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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-full text-xs font-mono shadow-lg z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg shadow-xl p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🐛 Debug Mode</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={debugEnabled}
            onChange={toggleDebug}
            className="rounded"
          />
          Enable Debug Mode
        </label>
      </div>

      {debugEnabled && (
        <>
          {currentDebugLoc && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
              <div className="font-semibold mb-1">Simulating Location:</div>
              <div>Lat: {currentDebugLoc.lat.toFixed(4)}</div>
              <div>Lng: {currentDebugLoc.lng.toFixed(4)}</div>
              <button
                onClick={clearLocation}
                className="mt-2 text-red-600 hover:text-red-800 text-xs"
              >
                Clear
              </button>
            </div>
          )}

          {locations.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2">Simulate Being At:</div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => simulateLocation(loc)}
                    className="w-full text-left px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 rounded border border-purple-200"
                  >
                    {loc.name}
                    <div className="text-[10px] text-gray-600">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-3 pt-3 border-t text-[10px] text-gray-500">
        Add ?debug=true to URL to enable
      </div>
    </div>
  );
}
