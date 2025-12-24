import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Haversine formula to calculate distance between two points in meters
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { locationId, lat, lng, previousLocationId } = await request.json();

    if (!locationId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'locationId, lat, and lng are required' },
        { status: 400 }
      );
    }

    // Get session and hunt
    const session = await prisma.playSession.findUnique({
      where: { id: sessionId },
      include: { hunt: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get current location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const radius = session.hunt.globalLocationRadiusMeters ?? 40;

    // Check 1: Are they at the correct (new/target) location?
    const distance = haversineDistance(lat, lng, location.lat, location.lng);
    const inRadius = distance <= radius;

    if (inRadius) {
      // Success! They're at the right place
      return NextResponse.json({
        inRadius: true,
        distance: Math.round(distance),
      });
    }

    // Check 2: Are they at the previous location?
    if (previousLocationId) {
      const previousLocation = await prisma.location.findUnique({
        where: { id: previousLocationId },
      });

      if (previousLocation) {
        const distanceFromPrevious = haversineDistance(
          lat,
          lng,
          previousLocation.lat,
          previousLocation.lng
        );
        const atPreviousLocation = distanceFromPrevious <= radius;

        if (atPreviousLocation) {
          // They're still at the previous location - friendly message, no strike
          return NextResponse.json({
            inRadius: false,
            atPreviousLocation: true,
            distance: Math.round(distance),
          });
        }
      }
    }

    // Check 3: They're somewhere else - wrong location, increment strike
    await prisma.playSession.update({
      where: { id: sessionId },
      data: {
        wrongLocationChecks: { increment: 1 },
      },
    });

    return NextResponse.json({
      inRadius: false,
      atPreviousLocation: false,
      distance: Math.round(distance),
    });
  } catch (error) {
    console.error('Error checking location:', error);
    return NextResponse.json(
      { error: 'Failed to check location' },
      { status: 500 }
    );
  }
}
