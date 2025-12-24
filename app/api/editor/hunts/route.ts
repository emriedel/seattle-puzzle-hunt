import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface HuntSummary {
  id: string;
  title: string;
  neighborhood: string;
  filename: string;
}

export async function GET() {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const huntsDir = path.join(process.cwd(), 'data', 'hunts');

    // Check if directory exists
    if (!fs.existsSync(huntsDir)) {
      return NextResponse.json({ error: 'Hunts directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(huntsDir);
    const huntFiles = files.filter(f => f.endsWith('.json'));

    const hunts: HuntSummary[] = [];

    for (const file of huntFiles) {
      const filePath = path.join(huntsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const huntData = JSON.parse(content);

      hunts.push({
        id: huntData.id,
        title: huntData.title,
        neighborhood: huntData.neighborhood,
        filename: file,
      });
    }

    return NextResponse.json({ hunts });
  } catch (error) {
    console.error('Error reading hunt files:', error);
    return NextResponse.json(
      { error: 'Failed to read hunt files' },
      { status: 500 }
    );
  }
}
