'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  photoUrl: string | null;
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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo is too large. Maximum size is 5MB.');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please select a JPG, PNG, or WebP image.');
      return;
    }

    setSelectedPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const submitLogbookEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !message && !selectedPhoto) return;

    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo first if selected
      if (selectedPhoto) {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('photo', selectedPhoto);

        const uploadRes = await fetch('/api/logbook/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        } else {
          console.error('Failed to upload photo');
          // Continue with submission even if photo upload fails
        }
        setUploadingPhoto(false);
      }

      // Submit logbook entry
      const res = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          huntId,
          sessionId,
          name: name || null,
          message: message || null,
          photoUrl: photoUrl || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setName('');
        setMessage('');
        setSelectedPhoto(null);
        setPhotoPreview(null);
        await loadLogbook();
      }
    } catch (err) {
      console.error('Failed to submit logbook entry:', err);
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📸 Photo (optional)
                  </label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Share a selfie of your group!
                  </p>
                  {photoPreview ? (
                    <div className="space-y-2">
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <Image
                          src={photoPreview}
                          alt="Photo preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removePhoto}
                        className="w-full"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-sm font-medium">Choose Photo</div>
                          <div className="text-xs text-muted-foreground">
                            JPG, PNG, or WebP (max 5MB)
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={submitting || uploadingPhoto || (!name && !message && !selectedPhoto)}
                  className="w-full"
                >
                  {uploadingPhoto ? 'Uploading photo...' : submitting ? 'Submitting...' : 'Sign Logbook'}
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
                      <p className="text-sm mb-2">{entry.message}</p>
                    )}
                    {entry.photoUrl && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border mt-2">
                        <Image
                          src={entry.photoUrl}
                          alt={`Photo from ${entry.name || 'Anonymous'}`}
                          fill
                          className="object-cover"
                        />
                      </div>
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
