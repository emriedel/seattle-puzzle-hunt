'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserLocation } from '@/lib/debug';
import DebugPanel from '@/components/DebugPanel';
import NumberCodeInput from '@/components/NumberCodeInput';
import WordCodeInput from '@/components/WordCodeInput';

interface Location {
  id: string;
  name: string;
  order: number;
  lat: number;
  lng: number;
  narrativeSnippet: string;
  puzzleType: string;
  puzzlePrompt: string;
  puzzleImage: string | null;
  puzzleAnswerLength: number;
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

type GameState = 'loading' | 'need_location_check' | 'at_location' | 'puzzle_solved' | 'completed';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.huntId as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load hunt and session
  useEffect(() => {
    async function loadHunt() {
      try {
        const res = await fetch(`/api/hunts/${huntId}`);
        if (!res.ok) throw new Error('Failed to load hunt');
        const data = await res.json();
        setHunt(data);

        // Get session from localStorage
        const storedSessionId = localStorage.getItem('current-session-id');
        if (!storedSessionId) {
          setError('No active session found. Please start the hunt from the hunt page.');
          return;
        }
        setSessionId(storedSessionId);
        setGameState('need_location_check');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hunt');
      }
    }
    loadHunt();
  }, [huntId]);

  const currentLocation = hunt?.locations[currentLocationIndex];

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
        setStatusMessage('You\'re here! Revealing the puzzle...');
        setGameState('at_location');
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
        setStatusMessage('Correct! 🎉');
        setGameState('puzzle_solved');
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
      setGameState('need_location_check');
      setStatusMessage('');
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

      setGameState('completed');
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

  if (gameState === 'loading' || !hunt || !currentLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{hunt.title}</h1>
            <span className="text-sm text-gray-600">
              {currentLocationIndex + 1} / {hunt.locations.length}
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

        {/* Current Location Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">{currentLocation.name}</h2>

          {/* Narrative */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {currentLocation.narrativeSnippet}
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              {statusMessage}
            </div>
          )}

          {/* Game State UI */}
          {gameState === 'need_location_check' && (
            <button
              onClick={checkLocation}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {isChecking ? 'Checking location...' : '🔍 Search for Clues'}
            </button>
          )}

          {gameState === 'at_location' && (
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold mb-2">Puzzle:</h3>
                <p className="text-sm text-gray-700">{currentLocation.puzzlePrompt}</p>
              </div>

              {currentLocation.puzzleType === 'number_code' && (
                <NumberCodeInput
                  length={currentLocation.puzzleAnswerLength}
                  onSubmit={submitPuzzleAnswer}
                  disabled={isChecking}
                />
              )}

              {currentLocation.puzzleType === 'word_code' && (
                <WordCodeInput
                  length={currentLocation.puzzleAnswerLength}
                  onSubmit={submitPuzzleAnswer}
                  disabled={isChecking}
                />
              )}
            </div>
          )}

          {gameState === 'puzzle_solved' && (
            <div>
              <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="font-semibold text-green-800 mb-2">✓ Puzzle Solved!</p>
                {currentLocation.nextRiddle && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-1">Next location:</p>
                    <p className="text-sm text-gray-700 italic">
                      {currentLocation.nextRiddle}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={moveToNextLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {currentLocation.nextLocationId ? 'Continue to Next Location →' : 'Complete Hunt! 🎉'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel locations={hunt.locations} />
    </div>
  );
}
