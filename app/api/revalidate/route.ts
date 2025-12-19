import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get secret from request body
    const body = await request.json();
    const { secret } = body;

    // Check secret token
    const expectedSecret = process.env.REVALIDATION_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Revalidation not configured' },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate hunt cache
    revalidateTag('hunts');

    return NextResponse.json({
      revalidated: true,
      message: 'Hunt cache invalidated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}
