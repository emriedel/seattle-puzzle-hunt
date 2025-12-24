import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ColorConfig {
  code: string;
  color: string;
  label: string;
}

interface PuzzleData {
  type: string;
  answer: string | number[];
  answer_length: number;
  colors?: ColorConfig[]; // Optional colors array for color_code puzzles
  images?: string[]; // Optional images array for tile_image puzzles
  image?: string; // Optional image path for slide_puzzle
}

interface LocationData {
  id: string;
  name: string;
  address?: string;
  order: number;
  coordinates: { lat: number; lng: number };
  location_riddle: string;
  location_found_text: string;
  search_location_button_text?: string;
  puzzle: PuzzleData;
  next_location_id: string | null;
}

interface HuntData {
  id: string;
  title: string;
  neighborhood: string;
  description?: string;
  image_url?: string;
  hunt_intro_text?: string;
  hunt_success_text?: string;
  estimated_time_minutes: number;
  global_location_radius_meters?: number;
  locations: LocationData[];
}

async function seedHunt(huntData: HuntData) {
  console.log(`Seeding hunt: ${huntData.title}`);

  // Upsert the hunt
  await prisma.hunt.upsert({
    where: { id: huntData.id },
    update: {
      title: huntData.title,
      neighborhood: huntData.neighborhood,
      description: huntData.description,
      imageUrl: huntData.image_url,
      huntIntroText: huntData.hunt_intro_text,
      huntSuccessText: huntData.hunt_success_text,
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters ?? 40,
    },
    create: {
      id: huntData.id,
      title: huntData.title,
      neighborhood: huntData.neighborhood,
      description: huntData.description,
      imageUrl: huntData.image_url,
      huntIntroText: huntData.hunt_intro_text,
      huntSuccessText: huntData.hunt_success_text,
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters ?? 40,
    },
  });

  // Delete all existing locations for this hunt to ensure clean sync
  const deleteResult = await prisma.location.deleteMany({
    where: { huntId: huntData.id },
  });
  if (deleteResult.count > 0) {
    console.log(`  🗑️  Deleted ${deleteResult.count} old location(s)`);
  }

  // Create locations from JSON
  for (const location of huntData.locations) {
    // Normalize answer based on type
    let normalizedAnswer: string;
    const puzzleType = location.puzzle.type as string;

    if (puzzleType === 'word_code' || puzzleType === 'tile_word') {
      if (typeof location.puzzle.answer !== 'string') {
        throw new Error(`Expected string answer for ${location.puzzle.type} at ${location.name}`);
      }
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    } else if (puzzleType === 'number_code.safe') {
      // Safe dial: convert array [6, 12, 18] to string "061218"
      if (Array.isArray(location.puzzle.answer)) {
        normalizedAnswer = location.puzzle.answer.map(n => n.toString().padStart(2, '0')).join('');
      } else if (typeof location.puzzle.answer === 'string') {
        // Fallback for old string format
        normalizedAnswer = location.puzzle.answer.padStart(location.puzzle.answer_length * 2, '0');
      } else {
        throw new Error(`Invalid answer format for number_code.safe at ${location.name}`);
      }
    } else if (puzzleType.startsWith('number_code')) {
      // Zero-pad number codes to answer_length (handles number_code, number_code.cryptex)
      if (typeof location.puzzle.answer !== 'string') {
        throw new Error(`Expected string answer for ${location.puzzle.type} at ${location.name}`);
      }
      normalizedAnswer = location.puzzle.answer.padStart(location.puzzle.answer_length, '0');
    } else if (puzzleType === 'directional_code' || puzzleType === 'simon_code' || puzzleType === 'color_code') {
      // Uppercase directional and color sequences
      if (typeof location.puzzle.answer !== 'string') {
        throw new Error(`Expected string answer for ${location.puzzle.type} at ${location.name}`);
      }
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    } else if (puzzleType === 'tile_image') {
      // Tile image: store answer as-is (e.g., "1,2,3,4")
      if (typeof location.puzzle.answer !== 'string') {
        throw new Error(`Expected string answer for ${location.puzzle.type} at ${location.name}`);
      }
      normalizedAnswer = location.puzzle.answer;
    } else {
      // Other types (slider_code, toggle_code, morse_code, slide_puzzle) use answer as-is
      normalizedAnswer = typeof location.puzzle.answer === 'string'
        ? location.puzzle.answer
        : location.puzzle.answer.toString();
    }

    // Extract puzzleConfig (for puzzles that need additional configuration)
    let puzzleConfig: any = null;
    if (puzzleType === 'color_code' && location.puzzle.colors) {
      puzzleConfig = { colors: location.puzzle.colors };
    } else if (puzzleType === 'tile_image' && location.puzzle.images) {
      puzzleConfig = { images: location.puzzle.images };
    } else if (puzzleType === 'slide_puzzle' && location.puzzle.image) {
      puzzleConfig = { image: location.puzzle.image };
    }

    await prisma.location.create({
      data: {
        id: location.id,
        huntId: huntData.id,
        name: location.name,
        address: location.address,
        order: location.order,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        locationRiddle: location.location_riddle,
        locationFoundText: location.location_found_text,
        searchLocationButtonText: location.search_location_button_text,
        puzzleType: location.puzzle.type,
        puzzleConfig: puzzleConfig,
        puzzleAnswer: normalizedAnswer,
        puzzleAnswerLength: location.puzzle.answer_length,
        nextLocationId: location.next_location_id,
      },
    });

    console.log(`  ✓ Seeded location: ${location.name}`);
  }
}

async function revalidateCache() {
  const revalidationSecret = process.env.REVALIDATION_SECRET;

  // Skip revalidation if no secret is set (development without server running)
  if (!revalidationSecret) {
    console.log('\n⚠️  REVALIDATION_SECRET not set - skipping cache invalidation');
    return;
  }

  // Determine the base URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    console.log('\n🔄 Invalidating hunt cache...');
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret: revalidationSecret }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Cache invalidated successfully at ${data.timestamp}`);
    } else {
      const error = await response.text();
      console.warn(`⚠️  Failed to invalidate cache: ${error}`);
    }
  } catch (error) {
    console.warn('⚠️  Could not reach revalidation endpoint (server may not be running)');
  }
}

async function main() {
  try {
    // Read all JSON files from data/hunts directory
    const huntsDir = path.join(process.cwd(), 'data', 'hunts');
    const files = fs.readdirSync(huntsDir);
    const huntFiles = files.filter(f => f.endsWith('.json'));

    console.log(`Found ${huntFiles.length} hunt file(s) in data/hunts/\n`);

    for (const file of huntFiles) {
      const filePath = path.join(huntsDir, file);
      const huntData: HuntData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await seedHunt(huntData);
    }

    console.log('\n✅ Seeding completed successfully!');

    // Invalidate cache after seeding
    await revalidateCache();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
