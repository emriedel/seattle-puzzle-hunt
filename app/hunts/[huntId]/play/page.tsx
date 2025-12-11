'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserLocation } from '@/lib/debug';
import DebugPanel from '@/components/DebugPanel';
import NumberCodeInput from '@/components/NumberCodeInput';
import NumericCryptexInput from '@/components/NumericCryptexInput';
import SafeDialInput from '@/components/SafeDialInput';
import CryptexInput from '@/components/CryptexInput';
import ToggleSwitchInput from '@/components/ToggleSwitchInput';
import DirectionalPadInput from '@/components/DirectionalPadInput';
import SimonPatternInput from '@/components/SimonPatternInput';
import MorseCodeInput from '@/components/MorseCodeInput';
import TileWordBuilderInput from '@/components/TileWordBuilderInput';
import SlidePuzzleInput from '@/components/SlidePuzzleInput';
import { TextPagination } from '@/components/TextPagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { NavigationMenu } from '@/components/NavigationMenu';
import { LocationHistoryViewer } from '@/components/LocationHistoryViewer';

interface Location {
  id: string;
  name: string;
  order: number;
  lat: number;
  lng: number;
  narrativeSnippet: string;
  locationFoundText: string;
  puzzleType: string;
  puzzlePrompt: string;
  puzzleImage: string | null;
  puzzleAnswerLength: number;
  puzzleSuccessText: string;
  nextRiddle: string;
  nextLocationId: string | null;
}

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  estimatedTimeMinutes: number;
  globalLocationRadiusMeters: number;
  locations: Location[];
}

type LocationState =
  | 'finding_location'      // Screen 1: showing clue, need location check
  | 'at_location_unsolved'  // Screen 2a: found location, puzzle not solved
  | 'at_location_solved';   // Screen 2b: puzzle solved, showing next clue button

interface HuntProgress {
  locationIndex: number;
  state: LocationState;
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.huntId as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [locationState, setLocationState] = useState<LocationState>('finding_location');
  const [statusMessage, setStatusMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [menuOpen, setMenuOpen] = useState(false);
  const [allHunts, setAllHunts] = useState<Array<{id: string; title: string; neighborhood: string}>>([]);
  const [viewingLocationId, setViewingLocationId] = useState<string | null>(null);

  const progressKey = `hunt-progress-${huntId}`;

  // Load hunt and session
  useEffect(() => {
    async function loadHunt() {
      try {
        // Fetch current hunt
        const res = await fetch(`/api/hunts/${huntId}`);
        if (!res.ok) throw new Error('Failed to load hunt');
        const data = await res.json();
        setHunt(data);

        // Fetch all hunts for switcher
        const allHuntsRes = await fetch('/api/hunts');
        if (allHuntsRes.ok) {
          const allHuntsData = await allHuntsRes.json();
          setAllHunts(allHuntsData.map((h: Hunt) => ({
            id: h.id,
            title: h.title,
            neighborhood: h.neighborhood,
          })));
        }

        // Get session from localStorage
        const storedSessionId = localStorage.getItem('current-session-id');
        if (!storedSessionId) {
          setError('No active session found. Please start the hunt from the hunt page.');
          return;
        }
        setSessionId(storedSessionId);

        // Load progress from localStorage
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
          try {
            const progress: HuntProgress = JSON.parse(savedProgress);
            setCurrentLocationIndex(progress.locationIndex);
            setLocationState(progress.state);
          } catch {
            // Invalid progress, start fresh
            setLocationState('finding_location');
          }
        } else {
          setLocationState('finding_location');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hunt');
      }
    }
    loadHunt();
  }, [huntId, progressKey]);

  // Save progress whenever state changes
  useEffect(() => {
    if (hunt && sessionId) {
      const progress: HuntProgress = {
        locationIndex: currentLocationIndex,
        state: locationState,
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [currentLocationIndex, locationState, hunt, sessionId, progressKey]);

  const currentLocation = hunt?.locations[currentLocationIndex];
  const previousLocation = currentLocationIndex > 0 ? hunt?.locations[currentLocationIndex - 1] : null;

  // Navigation handlers
  const handleExitHunt = () => {
    // Navigate back to hunt detail page, preserving progress
    router.push(`/hunts/${huntId}`);
  };

  const handleRestartHunt = () => {
    // Clear progress and reload the page
    localStorage.removeItem(progressKey);
    setCurrentLocationIndex(0);
    setLocationState('finding_location');
    setStatusMessage('');
    window.scrollTo(0, 0);
  };

  const handleViewLocation = (locationId: string) => {
    setViewingLocationId(locationId);
  };

  // Get completed locations for history
  const completedLocations = hunt?.locations
    .slice(0, currentLocationIndex)
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      order: loc.order,
    })) || [];

  // Get the location data for the history viewer
  const viewingLocation = viewingLocationId
    ? hunt?.locations.find(loc => loc.id === viewingLocationId)
    : null;

  const checkLocation = async () => {
    if (!sessionId || !currentLocation) return;

    setIsChecking(true);
    setStatusMessage('Getting your location...');

    try {
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;

      setStatusMessage('Checking if you\'re at the location...');

      const res = await fetch(`/api/session/${sessionId}/location-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: currentLocation.id,
          lat: latitude,
          lng: longitude,
        }),
      });

      if (!res.ok) throw new Error('Location check failed');
      const { inRadius, distance } = await res.json();

      if (inRadius) {
        setStatusMessage('You\'re here!');
        setLocationState('at_location_unsolved');
      } else {
        setStatusMessage(
          `You're ${distance}m away. Get within ${hunt?.globalLocationRadiusMeters}m to continue.`
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User denied')) {
        setStatusMessage('Location access denied. Please enable location permissions.');
      } else {
        setStatusMessage(err instanceof Error ? err.message : 'Location check failed');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const submitPuzzleAnswer = async (answer: string) => {
    if (!sessionId || !currentLocation) return;

    setIsChecking(true);
    setStatusMessage('Checking your answer...');

    try {
      const res = await fetch(`/api/session/${sessionId}/validate-puzzle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: currentLocation.id,
          answer,
        }),
      });

      if (!res.ok) throw new Error('Failed to validate answer');
      const { correct } = await res.json();

      if (correct) {
        setStatusMessage('');
        setLocationState('at_location_solved');
      } else {
        setStatusMessage('Incorrect answer. Try again!');
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsChecking(false);
    }
  };

  const moveToNextLocation = () => {
    if (!hunt) return;

    if (currentLocationIndex < hunt.locations.length - 1) {
      setCurrentLocationIndex(currentLocationIndex + 1);
      setLocationState('finding_location');
      setStatusMessage('');
      window.scrollTo(0, 0);
    } else {
      completeHunt();
    }
  };

  const completeHunt = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/session/${sessionId}/complete`, {
        method: 'POST',
      });

      // Clear progress
      localStorage.removeItem(progressKey);
      router.push(`/hunts/${huntId}/complete?session=${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete hunt');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push(`/hunts/${huntId}`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Back to hunt
          </button>
        </div>
      </div>
    );
  }

  if (!hunt || !currentLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Determine what clue to show in Screen 1
  const clueText = currentLocationIndex === 0
    ? currentLocation.narrativeSnippet  // First location uses its narrativeSnippet
    : previousLocation?.nextRiddle || '';  // Subsequent locations use previous location's riddle

  return (
    <>
      <Header
        title={hunt.title}
        showBackButton={false}
        onMenuClick={() => setMenuOpen(true)}
      />

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentHunt={{
          id: hunt.id,
          title: hunt.title,
          progress: {
            current: currentLocationIndex + 1,
            total: hunt.locations.length,
          },
        }}
        completedLocations={completedLocations}
        allHunts={allHunts}
        onExitHunt={handleExitHunt}
        onRestartHunt={handleRestartHunt}
        onViewLocation={handleViewLocation}
      />

      <LocationHistoryViewer
        location={viewingLocation ? {
          id: viewingLocation.id,
          name: viewingLocation.name,
          order: viewingLocation.order,
          narrativeSnippet: viewingLocation.narrativeSnippet,
          locationFoundText: viewingLocation.locationFoundText,
          puzzleType: viewingLocation.puzzleType,
          puzzlePrompt: viewingLocation.puzzlePrompt,
          puzzleAnswer: '***', // Show placeholder in history for security
          puzzleSuccessText: viewingLocation.puzzleSuccessText,
          nextRiddle: viewingLocation.nextRiddle,
        } : null}
        open={!!viewingLocationId}
        onOpenChange={(open) => !open && setViewingLocationId(null)}
      />

      <div className="min-h-screen p-4 md:p-8 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Location {currentLocationIndex + 1} of {hunt.locations.length}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${((currentLocationIndex + 1) / hunt.locations.length) * 100}%`,
                }}
              />
            </div>
          </div>

        {/* Screen 1: Finding Location */}
        {locationState === 'finding_location' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {currentLocationIndex === 0 ? 'Your Quest Begins' : 'Next Location'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TextPagination text={clueText} className="italic text-muted-foreground" />

              {statusMessage && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                  {statusMessage}
                </div>
              )}

              <Button
                onClick={checkLocation}
                disabled={isChecking}
                className="w-full"
                size="lg"
              >
                {isChecking ? 'Checking location...' : '🔍 Search for Clues'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Screen 2a: At Location, Puzzle Unsolved */}
        {locationState === 'at_location_unsolved' && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <TextPagination text={currentLocation.locationFoundText} />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Puzzle:</h3>
                <TextPagination text={currentLocation.puzzlePrompt} className="text-sm text-muted-foreground" />

                {statusMessage && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                    {statusMessage}
                  </div>
                )}

                {/* Number-based puzzle inputs */}
                {currentLocation.puzzleType.startsWith('number_code') && (() => {
                  const subType = currentLocation.puzzleType.split('.')[1];
                  const props = {
                    length: currentLocation.puzzleAnswerLength,
                    onSubmit: submitPuzzleAnswer,
                    disabled: isChecking,
                  };

                  if (subType === 'cryptex') {
                    return <NumericCryptexInput {...props} />;
                  } else if (subType === 'safe') {
                    return <SafeDialInput {...props} />;
                  } else {
                    // Default to simple number input
                    return <NumberCodeInput {...props} />;
                  }
                })()}

                {/* Word-based puzzle input */}
                {currentLocation.puzzleType === 'word_code' && (
                  <CryptexInput
                    length={currentLocation.puzzleAnswerLength}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Toggle switches puzzle */}
                {currentLocation.puzzleType === 'toggle_code' && (
                  <ToggleSwitchInput
                    switchCount={currentLocation.puzzleAnswerLength}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Directional pad puzzle */}
                {currentLocation.puzzleType === 'directional_code' && (
                  <DirectionalPadInput
                    maxLength={currentLocation.puzzleAnswerLength}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Simon pattern puzzle */}
                {currentLocation.puzzleType === 'simon_code' && (
                  <SimonPatternInput
                    maxLength={currentLocation.puzzleAnswerLength}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Morse code puzzle */}
                {currentLocation.puzzleType === 'morse_code' && (
                  <MorseCodeInput
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Tile word builder puzzle */}
                {currentLocation.puzzleType === 'tile_word' && (
                  <TileWordBuilderInput
                    tiles={currentLocation.puzzlePrompt.match(/[A-Z]/g) || []}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}

                {/* Slide puzzle */}
                {currentLocation.puzzleType === 'slide_puzzle' && (
                  <SlidePuzzleInput
                    imagePath={currentLocation.puzzleImage || '/puzzle-images/default.jpg'}
                    onSubmit={submitPuzzleAnswer}
                    disabled={isChecking}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Screen 2b: At Location, Puzzle Solved */}
        {locationState === 'at_location_solved' && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="font-semibold mb-3">✓ Puzzle Solved!</p>
                <TextPagination text={currentLocation.puzzleSuccessText} />
              </div>

              {currentLocation.nextRiddle && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Your next clue:</p>
                  <TextPagination text={currentLocation.nextRiddle} className="text-sm italic text-muted-foreground" />
                </div>
              )}

              <Button
                onClick={moveToNextLocation}
                className="w-full"
                size="lg"
              >
                {currentLocation.nextLocationId ? 'Continue to Next Location →' : 'Complete Hunt! 🎉'}
              </Button>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Debug Panel */}
        <DebugPanel locations={hunt.locations} />
      </div>
    </>
  );
}
