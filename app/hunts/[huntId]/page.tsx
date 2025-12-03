'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getUserLocation } from '@/lib/debug';
import DebugPanel from '@/components/DebugPanel';

interface Location {
  id: string;
  name: string;
  order: number;
  lat: number;
  lng: number;
}

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  estimatedTimeMinutes: number;
  globalLocationRadiusMeters: number;
  locations: Location[];
}

export default function HuntDetailPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.huntId as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  useEffect(() => {
    async function fetchHunt() {
      try {
        const res = await fetch(`/api/hunts/${huntId}`);
        if (!res.ok) throw new Error('Failed to fetch hunt');
        const data = await res.json();
        setHunt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchHunt();
  }, [huntId]);

  async function handleStartHunt() {
    if (!hunt) return;

    setCheckingLocation(true);
    setLocationStatus('Checking your location...');

    try {
      // Get user location (or debug location)
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;
      const firstLocation = hunt.locations[0];

      // Get or create client ID
      let clientId = localStorage.getItem('puzzle-hunt-client-id');
      if (!clientId) {
        clientId = uuidv4();
        localStorage.setItem('puzzle-hunt-client-id', clientId);
      }

      // Start session
      const sessionRes = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huntId: hunt.id, clientId }),
      });

      if (!sessionRes.ok) throw new Error('Failed to start session');
      const { sessionId } = await sessionRes.json();

      // Check if at first location
      const checkRes = await fetch(`/api/session/${sessionId}/location-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: firstLocation.id,
          lat: latitude,
          lng: longitude,
        }),
      });

      if (!checkRes.ok) throw new Error('Failed to check location');
      const { inRadius, distance } = await checkRes.json();

      if (inRadius) {
        // Store session and navigate to play page
        localStorage.setItem('current-session-id', sessionId);
        router.push(`/hunts/${huntId}/play`);
      } else {
        setLocationStatus(
          `You're ${distance}m away from the starting point. Please get within ${hunt.globalLocationRadiusMeters}m to start.`
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('not supported')) {
        setLocationStatus('Geolocation is not supported by your browser');
      } else if (err instanceof Error && err.message.includes('denied')) {
        setLocationStatus('Location access denied. Please enable location permissions or use debug mode.');
      } else {
        setLocationStatus(err instanceof Error ? err.message : 'Failed to start hunt');
      }
    } finally {
      setCheckingLocation(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading hunt details...</p>
      </div>
    );
  }

  if (error || !hunt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error || 'Hunt not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{hunt.title}</h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">📍 {hunt.neighborhood}</p>
            <p className="text-gray-600">⏱️ ~{hunt.estimatedTimeMinutes} minutes</p>
            <p className="text-gray-600">📏 Must be within {hunt.globalLocationRadiusMeters}m of each location</p>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-2">Hunt Stops ({hunt.locations.length}):</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              {hunt.locations.map((loc) => (
                <li key={loc.id}>{loc.name}</li>
              ))}
            </ol>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Starting location: {hunt.locations[0].name}
              <br />
              <span className="text-xs">
                ({hunt.locations[0].lat.toFixed(4)}, {hunt.locations[0].lng.toFixed(4)})
              </span>
            </p>
          </div>

          {locationStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              {locationStatus}
            </div>
          )}

          <button
            onClick={handleStartHunt}
            disabled={checkingLocation}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {checkingLocation ? 'Checking location...' : 'Start Hunt'}
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel locations={hunt.locations} />
    </div>
  );
}
