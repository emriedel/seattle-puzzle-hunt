import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PuzzleData {
  type: 'number_code' | 'word_code';
  prompt: string;
  image: string | null;
  answer: string;
  answer_length: number;
}

interface LocationData {
  id: string;
  name: string;
  order: number;
  coordinates: { lat: number; lng: number };
  narrative_snippet: string;
  location_found_text: string;
  puzzle: PuzzleData;
  puzzle_success_text: string;
  next_riddle: string;
  next_location_id: string | null;
}

interface HuntData {
  id: string;
  title: string;
  neighborhood: string;
  estimated_time_minutes: number;
  global_location_radius_meters: number;
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
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters,
    },
    create: {
      id: huntData.id,
      title: huntData.title,
      neighborhood: huntData.neighborhood,
      estimatedTimeMinutes: huntData.estimated_time_minutes,
      globalLocationRadiusMeters: huntData.global_location_radius_meters,
    },
  });

  // Upsert locations
  for (const location of huntData.locations) {
    // Normalize answer based on type
    let normalizedAnswer = location.puzzle.answer;
    if (location.puzzle.type === 'word_code') {
      normalizedAnswer = location.puzzle.answer.toUpperCase();
    } else if (location.puzzle.type === 'number_code') {
      // Zero-pad number codes to answer_length
      normalizedAnswer = location.puzzle.answer.padStart(location.puzzle.answer_length, '0');
    }

    await prisma.location.upsert({
      where: { id: location.id },
      update: {
        name: location.name,
        order: location.order,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        narrativeSnippet: location.narrative_snippet,
        locationFoundText: location.location_found_text,
        puzzleType: location.puzzle.type,
        puzzlePrompt: location.puzzle.prompt,
        puzzleImage: location.puzzle.image,
        puzzleAnswer: normalizedAnswer,
        puzzleAnswerLength: location.puzzle.answer_length,
        puzzleSuccessText: location.puzzle_success_text,
        nextRiddle: location.next_riddle,
        nextLocationId: location.next_location_id,
      },
      create: {
        id: location.id,
        huntId: huntData.id,
        name: location.name,
        order: location.order,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        narrativeSnippet: location.narrative_snippet,
        locationFoundText: location.location_found_text,
        puzzleType: location.puzzle.type,
        puzzlePrompt: location.puzzle.prompt,
        puzzleImage: location.puzzle.image,
        puzzleAnswer: normalizedAnswer,
        puzzleAnswerLength: location.puzzle.answer_length,
        puzzleSuccessText: location.puzzle_success_text,
        nextRiddle: location.next_riddle,
        nextLocationId: location.next_location_id,
      },
    });

    console.log(`  ✓ Seeded location: ${location.name}`);
  }
}

async function main() {
  try {
    // Read all JSON files from spec directory
    const specDir = path.join(process.cwd(), 'spec');
    const files = fs.readdirSync(specDir);
    const huntFiles = files.filter(f => f.startsWith('example_hunt_') && f.endsWith('.json'));

    for (const file of huntFiles) {
      const filePath = path.join(specDir, file);
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
