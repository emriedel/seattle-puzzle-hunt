import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

/**
 * Cached query for getting all hunts with basic info + locations.
 * Revalidates every hour.
 */
export const getCachedHunts = unstable_cache(
  async () => {
    return await prisma.hunt.findMany({
      select: {
        id: true,
        title: true,
        neighborhood: true,
        description: true,
        estimatedTimeMinutes: true,
        imageUrl: true,
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  },
  ['hunts-list'],
  {
    revalidate: 3600, // 1 hour
    tags: ['hunts'],
  }
);

/**
 * Cached query for getting a single hunt with full details (except puzzle answers).
 * Revalidates every hour.
 */
export const getCachedHunt = unstable_cache(
  async (huntId: string) => {
    return await prisma.hunt.findUnique({
      where: { id: huntId },
      select: {
        id: true,
        title: true,
        neighborhood: true,
        description: true,
        huntIntroText: true,
        huntSuccessText: true,
        estimatedTimeMinutes: true,
        globalLocationRadiusMeters: true,
        imageUrl: true,
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            order: true,
            lat: true,
            lng: true,
            locationRiddle: true,
            locationFoundText: true,
            searchLocationButtonText: true,
            puzzleType: true,
            puzzleConfig: true,
            puzzleAnswerLength: true,
            nextLocationId: true,
            // Explicitly exclude puzzleAnswer for security
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  },
  ['hunt-detail'],
  {
    revalidate: 3600, // 1 hour
    tags: ['hunts'],
  }
);
