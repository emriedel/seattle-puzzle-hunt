import { Card, CardContent } from '@/components/ui/card';
import { HuntCard } from '@/components/HuntCard';

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

async function getHunts(): Promise<Hunt[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/hunts`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch hunts');
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching hunts:', error);
    return [];
  }
}

export default async function HuntsPage() {
  const hunts = await getHunts();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Available Hunts</h1>

        {hunts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                No hunts available yet. Make sure to seed the database with hunt data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hunts.map((hunt) => (
              <HuntCard key={hunt.id} hunt={hunt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
