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
    const { locationId, lat, lng } = await request.json();

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

    // Get location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Calculate distance
    const distance = haversineDistance(lat, lng, location.lat, location.lng);
    const inRadius = distance <= session.hunt.globalLocationRadiusMeters;

    // If not in radius, increment wrong location checks
    if (!inRadius) {
      await prisma.playSession.update({
        where: { id: sessionId },
        data: {
          wrongLocationChecks: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      inRadius,
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
