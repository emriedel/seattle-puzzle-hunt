import React from 'react';
import Image from 'next/image';
import { TextBlock, HandwritingStyle } from '@/lib/text-parser';

interface RichTextProps {
  blocks: TextBlock[];
  className?: string;
}

/**
 * Get Tailwind font class for handwriting style
 */
function getHandwritingClass(style: HandwritingStyle): string {
  switch (style) {
    case 'scrawl':
      return 'font-handwritten-scrawl';
    case 'elegant':
      return 'font-handwritten-elegant';
    case 'graffiti':
      return 'font-handwritten-graffiti';
    case 'default':
    default:
      return 'font-handwritten';
  }
}

/**
 * Get Tailwind color class for colored text
 */
function getColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
  };
  return colorMap[color.toLowerCase()] || 'text-foreground';
}

/**
 * Simple hash function to generate a seed from string content
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (returns 0-1)
 */
function seededRandom(seed: number): () => number {
  let current = seed;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

/**
 * Generate a unique torn edge polygon based on content
 */
function generateTornEdge(content: string): string {
  const seed = hashString(content);
  const random = seededRandom(seed);

  // Generate 8 corner points with slight variations (0-2%)
  const points = [
    `${random() * 2}% ${random() * 2}%`,           // top-left
    `${50 + (random() - 0.5) * 2}% ${random() * 2}%`, // top-middle
    `${98 + random() * 2}% ${random() * 2}%`,      // top-right
    `${98 + random() * 2}% ${50 + (random() - 0.5) * 2}%`, // right-middle
    `${98 + random() * 2}% ${98 + random() * 2}%`, // bottom-right
    `${50 + (random() - 0.5) * 2}% ${98 + random() * 2}%`, // bottom-middle
    `${random() * 2}% ${98 + random() * 2}%`,      // bottom-left
    `${random() * 2}% ${50 + (random() - 0.5) * 2}%`,  // left-middle
  ];

  return `polygon(${points.join(', ')})`;
}

/**
 * Render a single text block
 */
function renderBlock(block: TextBlock, index: number): React.ReactNode {
  switch (block.type) {
    case 'text':
      return <span key={index}>{block.content}</span>;

    case 'bold':
      return <strong key={index}>{block.content}</strong>;

    case 'italic':
      return <em key={index}>{block.content}</em>;

    case 'handwritten':
      const fontClass = getHandwritingClass(block.style || 'default');
      // Extract text content for seeding the torn edge pattern
      const textContent = block.content || (block.children?.map(c => c.content).join('') || '');
      const tornEdge = generateTornEdge(textContent);

      return (
        <div
          key={index}
          className={`${fontClass} text-2xl text-center text-amber-900 p-6 my-6 mx-auto w-fit max-w-md min-w-[200px] border border-[#d4c5a9]`}
          style={{
            background: `
              radial-gradient(circle at center, rgba(246, 239, 220, 0.7) 0%, rgba(239, 227, 196, 0.9) 100%),
              url(/parchment-texture.jpg)
            `,
            backgroundSize: 'cover',
            backgroundBlendMode: 'multiply',
            clipPath: tornEdge,
            boxShadow: `
              0 2px 4px rgba(0, 0, 0, 0.15),
              0 1px 2px rgba(0, 0, 0, 0.1),
              inset 0 0 12px rgba(0, 0, 0, 0.15),
              inset 0 0 2px rgba(0, 0, 0, 0.3)
            `,
            textShadow: '0.3px 0.3px 0 rgba(0, 0, 0, 0.15)',
            letterSpacing: '0.02em',
            filter: 'contrast(1.02) brightness(0.98)',
          }}
        >
          {block.children && block.children.length > 0
            ? block.children.map((child, childIndex) => renderBlock(child, childIndex))
            : block.content}
        </div>
      );

    case 'colored':
      const colorClass = getColorClass(block.color || 'foreground');
      return <span key={index} className={colorClass}>{block.content}</span>;

    case 'image':
      return (
        <div key={index} className="my-4 rounded-lg overflow-hidden">
          <Image
            src={block.content}
            alt="Puzzle clue"
            width={400}
            height={300}
            className="w-full h-auto"
          />
        </div>
      );

    case 'br':
      return <br key={index} />;

    case 'linebreak':
      return <div key={index} className="h-4" />;

    default:
      return null;
  }
}

/**
 * RichText component - renders parsed text blocks with formatting
 */
export function RichText({ blocks, className = '' }: RichTextProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`leading-relaxed ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
