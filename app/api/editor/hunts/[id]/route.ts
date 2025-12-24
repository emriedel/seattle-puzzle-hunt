import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// GET /api/editor/hunts/[id] - Read a specific hunt file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const huntsDir = path.join(process.cwd(), 'data', 'hunts');

    // Find the hunt file by ID
    const files = fs.readdirSync(huntsDir);
    const huntFiles = files.filter(f => f.endsWith('.json'));

    let targetFile: string | null = null;

    for (const file of huntFiles) {
      const filePath = path.join(huntsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const huntData = JSON.parse(content);

      if (huntData.id === id) {
        targetFile = file;
        return NextResponse.json({
          hunt: huntData,
          filename: file,
        });
      }
    }

    return NextResponse.json(
      { error: 'Hunt not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error reading hunt file:', error);
    return NextResponse.json(
      { error: 'Failed to read hunt file' },
      { status: 500 }
    );
  }
}

// POST /api/editor/hunts/[id] - Save changes to a hunt file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { hunt, filename } = body;

    if (!hunt || !filename) {
      return NextResponse.json(
        { error: 'Missing hunt data or filename' },
        { status: 400 }
      );
    }

    // Validate that the hunt ID matches the URL param
    if (hunt.id !== id) {
      return NextResponse.json(
        { error: 'Hunt ID mismatch' },
        { status: 400 }
      );
    }

    const huntsDir = path.join(process.cwd(), 'data', 'hunts');
    const filePath = path.join(huntsDir, filename);

    // Write the hunt data to file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(hunt, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Hunt saved successfully',
    });
  } catch (error) {
    console.error('Error saving hunt file:', error);
    return NextResponse.json(
      { error: 'Failed to save hunt file' },
      { status: 500 }
    );
  }
}
