'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import { getUserLocation } from '@/lib/debug';
import DebugPanel from '@/components/DebugPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { Header } from '@/components/Header';
import { NavigationMenu } from '@/components/NavigationMenu';

const MapView = dynamic(() => import('@/components/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />
});

interface Location {
  id: string;
  name: string;
  address: string | null;
  order: number;
  lat: number;
  lng: number;
}

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  description: string | null;
  estimatedTimeMinutes: number;
  globalLocationRadiusMeters: number | null;
  locations: Location[];
}

export default function HuntDetailPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.huntId as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [allHunts, setAllHunts] = useState<Array<{id: string; title: string; neighborhood: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current hunt details
        const huntRes = await fetch(`/api/hunts/${huntId}`);
        if (!huntRes.ok) throw new Error('Failed to fetch hunt');
        const huntData = await huntRes.json();
        setHunt(huntData);

        // Fetch all hunts for the switcher
        const allHuntsRes = await fetch('/api/hunts');
        if (allHuntsRes.ok) {
          const allHuntsData = await allHuntsRes.json();
          setAllHunts(allHuntsData.map((h: Hunt) => ({
            id: h.id,
            title: h.title,
            neighborhood: h.neighborhood,
          })));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
        setLocationStatus('Head to the starting location to begin!');
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

  const startingLocation = hunt.locations[0];

  return (
    <>
      <Header
        onMenuClick={() => setMenuOpen(true)}
      />

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentHunt={{
          id: hunt.id,
          title: hunt.title,
        }}
        allHunts={allHunts}
      />

      <div className="min-h-screen pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Hunt info */}
          <div className="px-4 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{hunt.title}</h1>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-4 text-sm mb-6">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{hunt.locations.length} {hunt.locations.length === 1 ? 'stop' : 'stops'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>~{hunt.estimatedTimeMinutes} min</span>
              </div>
            </div>

            {hunt.description && (
              <p className="text-muted-foreground text-lg">{hunt.description}</p>
            )}
          </div>

          {/* Start button */}
          <div className="px-4 md:px-6 mb-4 flex justify-center">
            <Button
              onClick={handleStartHunt}
              disabled={checkingLocation}
              className="w-full max-w-xs"
              size="lg"
            >
              {checkingLocation ? 'Checking location...' : 'Start Hunt'}
            </Button>
          </div>

          {/* Location status message */}
          {locationStatus && (
            <div className="px-4 md:px-6 mb-6">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-center">
                {locationStatus}
              </div>
            </div>
          )}

        {/* Map section */}
        <div className="px-4 md:px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Starting Location
              </CardTitle>
              <CardDescription>
                Head to this location to begin your hunt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location info */}
              <div>
                <h3 className="font-semibold text-lg mb-1">{startingLocation.name}</h3>
                {startingLocation.address && (
                  <p className="text-sm text-muted-foreground">{startingLocation.address}</p>
                )}
              </div>

              {/* Map */}
              <MapView
                startLat={startingLocation.lat}
                startLng={startingLocation.lng}
                startLocationName={startingLocation.name}
                radius={hunt.globalLocationRadiusMeters ?? 40}
              />
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Debug Panel */}
        <DebugPanel locations={hunt.locations} />
      </div>
    </>
  );
}
