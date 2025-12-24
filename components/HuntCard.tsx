import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Clock, Navigation } from 'lucide-react';

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
  imageUrl?: string | null;
}

interface HuntCardProps {
  hunt: Hunt;
}

// Generate a consistent color from hunt ID
function getColorFromId(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ];

  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function HuntCard({ hunt }: HuntCardProps) {
  const startingLocation = hunt.locations[0];
  const stopCount = hunt.locations.length;
  const colorClass = getColorFromId(hunt.id);

  // Get initials from title
  const initials = hunt.title
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/hunts/${hunt.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden">
        <div className="flex">
          {/* Hunt image or colored placeholder */}
          {hunt.imageUrl ? (
            <div className="relative w-24 md:w-32 h-full flex-shrink-0 bg-muted">
              <Image
                src={hunt.imageUrl}
                alt={hunt.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
              />
            </div>
          ) : (
            <div className={`${colorClass} w-24 md:w-32 flex-shrink-0 flex items-center justify-center`}>
              <span className="text-white text-3xl md:text-4xl font-bold">
                {initials}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <CardHeader className="pb-3">
              <h3 className="text-xl font-bold leading-tight">{hunt.title}</h3>
              {hunt.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {hunt.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              {/* Starting location */}
              {startingLocation && (
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{startingLocation.name}</div>
                    {startingLocation.address && (
                      <div className="text-xs text-muted-foreground">
                        {startingLocation.address}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{stopCount} {stopCount === 1 ? 'stop' : 'stops'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>~{hunt.estimatedTimeMinutes} min</span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </Link>
  );
}
