'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <p className="text-muted-foreground">Congratulations on finishing the hunt</p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {formatTime(session.totalTimeSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {session.wrongLocationChecks}
                </div>
                <div className="text-sm text-muted-foreground">Wrong Checks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">
                  {session.wrongPuzzleGuesses}
                </div>
                <div className="text-sm text-muted-foreground">Wrong Guesses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logbook Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sign the Logbook</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="font-semibold">✓ Thanks for signing the logbook!</p>
              </div>
            ) : (
              <form onSubmit={submitLogbookEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Anonymous Explorer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Share your experience..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting || (!name && !message)}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Sign Logbook'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Recent Logbook Entries */}
        {logbookEntries.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Logbook Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logbookEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-muted/50 border border-border rounded-lg"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-sm">
                        {entry.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    {entry.message && (
                      <p className="text-sm">{entry.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="secondary" asChild className="flex-1">
            <Link href="/hunts">
              Browse More Hunts
            </Link>
          </Button>
          <Button
            onClick={() => {
              localStorage.removeItem('current-session-id');
              router.push(`/hunts/${huntId}`);
            }}
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
