import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
  estimatedTimeMinutes: number;
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
              <Link key={hunt.id} href={`/hunts/${hunt.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle>{hunt.title}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-4 mt-2">
                        <span>📍 {hunt.neighborhood}</span>
                        <span>⏱️ ~{hunt.estimatedTimeMinutes} min</span>
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
