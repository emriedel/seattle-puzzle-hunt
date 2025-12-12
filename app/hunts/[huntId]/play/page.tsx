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
  locationRiddle: string;
  locationFoundText: string;
  searchLocationButtonText?: string;
  puzzleType: string;
  puzzleAnswerLength: number;
  nextLocationId: string | null;
}

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  huntIntroText?: string;
  huntSuccessText?: string;
  estimatedTimeMinutes: number;
  globalLocationRadiusMeters: number | null;
  locations: Location[];
}

// Page-based navigation model:
// - Page 0: Hunt intro (if huntIntroText exists)
// - For each location i:
//   - Page (2*i + 1 + offset): Location riddle
//   - Page (2*i + 2 + offset): Location found + puzzle
// - Final page: Hunt success

interface HuntProgress {
  currentPage: number;
  maxPageReached: number;
  solvedLocations: number[]; // Array for JSON serialization
  visitedLocations: number[]; // Array for JSON serialization
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.huntId as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPageReached, setMaxPageReached] = useState(0);
  const [solvedLocations, setSolvedLocations] = useState<Set<number>>(new Set());
  const [visitedLocations, setVisitedLocations] = useState<Set<number>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [menuOpen, setMenuOpen] = useState(false);
  const [allHunts, setAllHunts] = useState<Array<{id: string; title: string; neighborhood: string}>>([]);
  const [viewingLocationId, setViewingLocationId] = useState<string | null>(null);

  const progressKey = `hunt-progress-${huntId}`;

  // Helper functions for page calculation
  const hasIntro = (hunt: Hunt | null) => !!hunt?.huntIntroText;
  const getOffset = (hunt: Hunt | null) => hasIntro(hunt) ? 1 : 0;
  const getTotalPages = (hunt: Hunt | null) => {
    if (!hunt) return 0;
    const offset = getOffset(hunt);
    return offset + (hunt.locations.length * 2) + 1; // intro + (riddle + puzzle) * locations + success
  };

  const getPageType = (page: number, hunt: Hunt | null): 'intro' | 'riddle' | 'puzzle' | 'success' | null => {
    if (!hunt) return null;
    const offset = getOffset(hunt);
    const totalPages = getTotalPages(hunt);

    if (page === 0 && hasIntro(hunt)) return 'intro';
    if (page === totalPages - 1) return 'success';

    const adjustedPage = page - offset;
    if (adjustedPage < 0) return null;

    const isRiddlePage = adjustedPage % 2 === 0;
    return isRiddlePage ? 'riddle' : 'puzzle';
  };

  const getLocationIndexForPage = (page: number, hunt: Hunt | null): number => {
    if (!hunt) return 0;
    const offset = getOffset(hunt);
    const adjustedPage = page - offset;
    return Math.floor(adjustedPage / 2);
  };

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
            setCurrentPage(progress.currentPage);
            setMaxPageReached(progress.maxPageReached);
            setSolvedLocations(new Set(progress.solvedLocations));
            setVisitedLocations(new Set(progress.visitedLocations));
          } catch {
            // Invalid progress, start fresh
            setCurrentPage(0);
            setMaxPageReached(0);
          }
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
        currentPage,
        maxPageReached,
        solvedLocations: Array.from(solvedLocations),
        visitedLocations: Array.from(visitedLocations),
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [currentPage, maxPageReached, solvedLocations, visitedLocations, hunt, sessionId, progressKey]);

  // Navigation handlers
  const handleExitHunt = () => {
    router.push(`/hunts/${huntId}`);
  };

  const handleRestartHunt = () => {
    localStorage.removeItem(progressKey);
    setCurrentPage(0);
    setMaxPageReached(0);
    setSolvedLocations(new Set());
    setVisitedLocations(new Set());
    setStatusMessage('');
    window.scrollTo(0, 0);
  };

  const handleViewLocation = (locationId: string) => {
    setViewingLocationId(locationId);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setStatusMessage('');
      window.scrollTo(0, 0);
    }
  };

  const goToNextPage = () => {
    if (currentPage < maxPageReached) {
      setCurrentPage(currentPage + 1);
      setStatusMessage('');
      window.scrollTo(0, 0);
    }
  };

  const advanceToNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    if (nextPage > maxPageReached) {
      setMaxPageReached(nextPage);
    }
    setStatusMessage('');
    window.scrollTo(0, 0);
  };

  // Get completed locations for history
  const completedLocations = hunt?.locations
    .filter((loc, idx) => solvedLocations.has(idx))
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      order: loc.order,
    })) || [];

  // Get the location data for the history viewer
  const viewingLocation = viewingLocationId
    ? hunt?.locations.find(loc => loc.id === viewingLocationId)
    : null;

  const checkLocation = async (locationIndex: number) => {
    if (!sessionId || !hunt) return;
    const location = hunt.locations[locationIndex];
    if (!location) return;

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
          locationId: location.id,
          lat: latitude,
          lng: longitude,
        }),
      });

      if (!res.ok) throw new Error('Location check failed');
      const { inRadius, distance } = await res.json();

      if (inRadius) {
        setStatusMessage('');
        setVisitedLocations(prev => new Set([...prev, locationIndex]));
        advanceToNextPage(); // Auto-advance to puzzle page
      } else {
        const radius = hunt?.globalLocationRadiusMeters ?? 40;
        setStatusMessage(
          `You're ${distance}m away. Get within ${radius}m to continue.`
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

  const submitPuzzleAnswer = async (answer: string, locationIndex: number) => {
    if (!sessionId || !hunt) return;
    const location = hunt.locations[locationIndex];
    if (!location) return;

    setIsChecking(true);
    setStatusMessage('Checking your answer...');

    try {
      const res = await fetch(`/api/session/${sessionId}/validate-puzzle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: location.id,
          answer,
        }),
      });

      if (!res.ok) throw new Error('Failed to validate answer');
      const { correct } = await res.json();

      if (correct) {
        setStatusMessage('');
        setSolvedLocations(prev => new Set([...prev, locationIndex]));

        // Check if this is the last location
        if (locationIndex === hunt.locations.length - 1) {
          // Last location - advance to hunt success page
          advanceToNextPage();
        } else {
          // Not last location - auto-advance to next location's riddle
          advanceToNextPage();
        }
      } else {
        setStatusMessage('Incorrect answer. Try again!');
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsChecking(false);
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

  if (!hunt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const pageType = getPageType(currentPage, hunt);
  const locationIndex = getLocationIndexForPage(currentPage, hunt);
  const currentLocation = hunt.locations[locationIndex];
  const isLocationVisited = visitedLocations.has(locationIndex);
  const isLocationSolved = solvedLocations.has(locationIndex);
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < maxPageReached;

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
            current: solvedLocations.size,
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
          locationRiddle: viewingLocation.locationRiddle,
          locationFoundText: viewingLocation.locationFoundText,
          puzzleType: viewingLocation.puzzleType,
          puzzleAnswer: '***',
          puzzleSuccessText: '',
        } : null}
        open={!!viewingLocationId}
        onOpenChange={(open) => !open && setViewingLocationId(null)}
      />

      <div className="min-h-screen p-4 md:p-8 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hunt Intro Page */}
          {pageType === 'intro' && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextPagination text={hunt.huntIntroText || ''} />

                <Button
                  onClick={advanceToNextPage}
                  className="w-full"
                  size="lg"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Location Riddle Page */}
          {pageType === 'riddle' && currentLocation && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locationIndex === 0 && !hasIntro(hunt) ? 'Your Quest Begins' : 'Next Location'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextPagination text={currentLocation.locationRiddle} className="italic text-muted-foreground" />

                {statusMessage && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                    {statusMessage}
                  </div>
                )}

                {!isLocationVisited && (
                  <Button
                    onClick={() => checkLocation(locationIndex)}
                    disabled={isChecking}
                    className="w-full"
                    size="lg"
                  >
                    {isChecking ? 'Checking location...' : (currentLocation.searchLocationButtonText || '🔍 Search for Clues')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Puzzle Page */}
          {pageType === 'puzzle' && currentLocation && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <TextPagination text={currentLocation.locationFoundText} />

                {!isLocationSolved && (
                  <div className="space-y-4">
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
                        onSubmit: (answer: string) => submitPuzzleAnswer(answer, locationIndex),
                        disabled: isChecking,
                      };

                      if (subType === 'cryptex') {
                        return <NumericCryptexInput {...props} />;
                      } else if (subType === 'safe') {
                        return <SafeDialInput {...props} />;
                      } else {
                        return <NumberCodeInput {...props} />;
                      }
                    })()}

                    {/* Word-based puzzle input */}
                    {currentLocation.puzzleType === 'word_code' && (
                      <CryptexInput
                        length={currentLocation.puzzleAnswerLength}
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Toggle switches puzzle */}
                    {currentLocation.puzzleType === 'toggle_code' && (
                      <ToggleSwitchInput
                        switchCount={currentLocation.puzzleAnswerLength}
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Directional pad puzzle */}
                    {currentLocation.puzzleType === 'directional_code' && (
                      <DirectionalPadInput
                        maxLength={currentLocation.puzzleAnswerLength}
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Simon pattern puzzle */}
                    {currentLocation.puzzleType === 'simon_code' && (
                      <SimonPatternInput
                        maxLength={currentLocation.puzzleAnswerLength}
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Morse code puzzle */}
                    {currentLocation.puzzleType === 'morse_code' && (
                      <MorseCodeInput
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Tile word builder puzzle */}
                    {currentLocation.puzzleType === 'tile_word' && (
                      <TileWordBuilderInput
                        tiles={currentLocation.locationFoundText.match(/[A-Z]/g) || []}
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}

                    {/* Slide puzzle */}
                    {currentLocation.puzzleType === 'slide_puzzle' && (
                      <SlidePuzzleInput
                        imagePath="/puzzle-images/default.jpg"
                        onSubmit={(answer) => submitPuzzleAnswer(answer, locationIndex)}
                        disabled={isChecking}
                      />
                    )}
                  </div>
                )}

                {isLocationSolved && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-semibold text-green-700">✓ Puzzle Solved!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hunt Success Page */}
          {pageType === 'success' && (
            <Card>
              <CardHeader>
                <CardTitle>Hunt Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextPagination text={hunt.huntSuccessText || 'Congratulations! You completed the hunt!'} />

                <Button
                  onClick={completeHunt}
                  className="w-full"
                  size="lg"
                >
                  Complete Hunt 🎉
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Previous / Next Navigation */}
          <div className="flex gap-4">
            <Button
              onClick={goToPreviousPage}
              disabled={!canGoBack}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              ← Previous
            </Button>
            <Button
              onClick={goToNextPage}
              disabled={!canGoForward}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Debug Panel */}
        <DebugPanel locations={hunt.locations} />
      </div>
    </>
  );
}
