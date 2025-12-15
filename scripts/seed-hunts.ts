import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PuzzleData {
  type: 'number_code' | 'word_code';
  answer: string | number[];
  answer_length: number;
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
      huntIntroText: huntData.hunt_intro_text,
      huntSuccessText: huntData.hunt_success_text,
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters ?? 40,
    },
  });

  // Upsert locations
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
    } else if (puzzleType === 'directional_code' || puzzleType === 'simon_code') {
      // Uppercase directional and color sequences
      if (typeof location.puzzle.answer !== 'string') {
        throw new Error(`Expected string answer for ${location.puzzle.type} at ${location.name}`);
      }
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    } else {
      // Other types (slider_code, toggle_code, morse_code) use answer as-is
      normalizedAnswer = typeof location.puzzle.answer === 'string'
        ? location.puzzle.answer
        : location.puzzle.answer.toString();
    }

    await prisma.location.upsert({
      where: { id: location.id },
      update: {
        name: location.name,
        address: location.address,
        order: location.order,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        locationRiddle: location.location_riddle,
        locationFoundText: location.location_found_text,
        searchLocationButtonText: location.search_location_button_text,
        puzzleType: location.puzzle.type,
        puzzleAnswer: normalizedAnswer,
        puzzleAnswerLength: location.puzzle.answer_length,
        nextLocationId: location.next_location_id,
      },
      create: {
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
        puzzleAnswer: normalizedAnswer,
        puzzleAnswerLength: location.puzzle.answer_length,
        nextLocationId: location.next_location_id,
      },
    });

    console.log(`  ✓ Seeded location: ${location.name}`);
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
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
