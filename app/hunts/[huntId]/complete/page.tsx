'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlaySession {
  id: string;
  startedAt: string;
  completedAt: string | null;
  wrongLocationChecks: number;
  wrongPuzzleGuesses: number;
  totalTimeSeconds: number | null;
}

interface LogbookEntry {
  id: string;
  name: string | null;
  message: string | null;
  createdAt: string;
}

export default function CompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const huntId = params.huntId as string;
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState<PlaySession | null>(null);
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    async function loadSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    }

    loadSession();
    loadLogbook();
  }, [sessionId, huntId]);

  const loadLogbook = async () => {
    try {
      const res = await fetch(`/api/logbook?huntId=${huntId}`);
      if (res.ok) {
        const entries = await res.json();
        setLogbookEntries(entries);
      }
    } catch (err) {
      console.error('Failed to load logbook:', err);
    }
  };

  const submitLogbookEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !message) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          huntId,
          sessionId,
          name: name || null,
          message: message || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setName('');
        setMessage('');
        await loadLogbook();
      }
    } catch (err) {
      console.error('Failed to submit logbook entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Completion Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Hunt Complete!</h1>
          <p className="text-gray-600">Congratulations on finishing the hunt</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(session.totalTimeSeconds)}
              </div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {session.wrongLocationChecks}
              </div>
              <div className="text-sm text-gray-600">Wrong Checks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {session.wrongPuzzleGuesses}
              </div>
              <div className="text-sm text-gray-600">Wrong Guesses</div>
            </div>
          </div>
        </div>

        {/* Logbook Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sign the Logbook</h2>
          {submitted ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-semibold">✓ Thanks for signing the logbook!</p>
            </div>
          ) : (
            <form onSubmit={submitLogbookEntry}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Anonymous Explorer"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Share your experience..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting || (!name && !message)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {submitting ? 'Submitting...' : 'Sign Logbook'}
              </button>
            </form>
          )}
        </div>

        {/* Recent Logbook Entries */}
        {logbookEntries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Logbook Entries</h2>
            <div className="space-y-3">
              {logbookEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-sm">
                      {entry.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  {entry.message && (
                    <p className="text-sm text-gray-700">{entry.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/hunts"
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold"
          >
            Browse More Hunts
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('current-session-id');
              router.push(`/hunts/${huntId}`);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
