import Link from 'next/link';

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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No hunts available yet. Make sure to seed the database with hunt data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hunts.map((hunt) => (
              <Link
                key={hunt.id}
                href={`/hunts/${hunt.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{hunt.title}</h2>
                <div className="text-gray-600 space-y-1">
                  <p>📍 {hunt.neighborhood}</p>
                  <p>⏱️ ~{hunt.estimatedTimeMinutes} minutes</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
