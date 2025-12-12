import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PuzzleData {
  type: 'number_code' | 'word_code';
  answer: string;
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
  puzzle_success_text: string;
  next_location_id: string | null;
}

interface HuntData {
  id: string;
  title: string;
  neighborhood: string;
  description?: string;
  hunt_intro_text?: string;
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
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters ?? 40,
    },
    create: {
      id: huntData.id,
      title: huntData.title,
      neighborhood: huntData.neighborhood,
      description: huntData.description,
      huntIntroText: huntData.hunt_intro_text,
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters ?? 40,
    },
  });

  // Upsert locations
  for (const location of huntData.locations) {
    // Normalize answer based on type
    let normalizedAnswer = location.puzzle.answer;
    if (location.puzzle.type === 'word_code' || location.puzzle.type === 'tile_word') {
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    } else if (location.puzzle.type.startsWith('number_code')) {
      // Zero-pad number codes to answer_length (handles number_code, number_code.cryptex, number_code.safe)
      normalizedAnswer = location.puzzle.answer.padStart(location.puzzle.answer_length, '0');
    } else if (location.puzzle.type === 'directional_code' || location.puzzle.type === 'simon_code') {
      // Uppercase directional and color sequences
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    }
    // Other types (slider_code, toggle_code, morse_code) use answer as-is

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
        puzzleSuccessText: location.puzzle_success_text,
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
        puzzleSuccessText: location.puzzle_success_text,
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
