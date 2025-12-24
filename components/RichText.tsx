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
      return (
        <div
          key={index}
          className={`${fontClass} text-2xl text-center text-amber-900 p-6 my-6 mx-auto w-fit max-w-md min-w-[200px] border border-[#d4c5a9]`}
          style={{
            transform: 'rotate(-0.5deg)',
            background: 'linear-gradient(to bottom, #f9f5e7 0%, #f4ecd8 100%)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 0 40px rgba(0, 0, 0, 0.02)',
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
