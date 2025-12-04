'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getUserLocation } from '@/lib/debug';
import DebugPanel from '@/components/DebugPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <h1 className="text-3xl font-bold mb-6">{hunt.title}</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hunt Details</CardTitle>
            <CardDescription>Get ready for your adventure through {hunt.neighborhood}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span>📍</span>
                <span>{hunt.neighborhood}</span>
              </p>
              <p className="flex items-center gap-2">
                <span>⏱️</span>
                <span>~{hunt.estimatedTimeMinutes} minutes</span>
              </p>
              <p className="flex items-center gap-2">
                <span>🗺️</span>
                <span>{hunt.locations.length} stops</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Starting coordinates:
              </p>
              <p className="text-sm font-mono">
                {hunt.locations[0].lat.toFixed(4)}, {hunt.locations[0].lng.toFixed(4)}
              </p>
            </div>

            {locationStatus && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                {locationStatus}
              </div>
            )}

            <Button
              onClick={handleStartHunt}
              disabled={checkingLocation}
              className="w-full"
              size="lg"
            >
              {checkingLocation ? 'Checking location...' : 'Start Hunt'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Debug Panel */}
      <DebugPanel locations={hunt.locations} />
    </div>
  );
}
