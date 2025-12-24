"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HuntCard } from '@/components/HuntCard';
import { Header } from '@/components/Header';
import { NavigationMenu } from '@/components/NavigationMenu';

interface Location {
  id: string;
  name: string;
  address: string | null;
  order: number;
}

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  description: string | null;
  estimatedTimeMinutes: number;
  locations: Location[];
}

export default function HuntsPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchHunts() {
      try {
        const res = await fetch('/api/hunts', {
          cache: 'no-store',
        });
        if (!res.ok) {
          console.error('Failed to fetch hunts');
          return;
        }
        const data = await res.json();
        setHunts(data);
      } catch (error) {
        console.error('Error fetching hunts:', error);
      }
    }
    fetchHunts();
  }, []);

  return (
    <>
      <Header
        onMenuClick={() => setMenuOpen(true)}
      />

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        allHunts={hunts.map(h => ({
          id: h.id,
          title: h.title,
          neighborhood: h.neighborhood,
        }))}
      />

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 mt-4 md:mt-6 text-center">Available Hunts</h1>

          {hunts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  No hunts available yet. Make sure to seed the database with hunt data.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-8">
                {hunts.map((hunt) => (
                  <HuntCard key={hunt.id} hunt={hunt} />
                ))}
              </div>

              <div className="mt-12 text-center">
                <p className="text-lg text-muted-foreground italic">More coming soon!</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
