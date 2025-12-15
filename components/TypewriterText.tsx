'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { parseRichText, TextBlock } from '@/lib/text-parser';
import { RichText } from './RichText';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  skipAnimation?: boolean;
  onComplete?: () => void;
}

// Helper to calculate total text length in a block tree
function getTotalTextLength(blocks: TextBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    if (block.type === 'text' || block.type === 'bold' || block.type === 'italic' || block.type === 'colored') {
      total += block.content.length;
    }
    if (block.children) {
      total += getTotalTextLength(block.children);
    }
  }
  return total;
}

// Helper to create partial blocks up to a character position
function getPartialBlocks(blocks: TextBlock[], targetChars: number): { blocks: TextBlock[], charsUsed: number } {
  const result: TextBlock[] = [];
  let charsUsed = 0;

  for (const block of blocks) {
    if (charsUsed >= targetChars) break;

    // Special blocks (handwritten, image, linebreak) are revealed instantly when reached
    if (block.type === 'handwritten') {
      // Handwritten blocks contain text in children - reveal all at once
      const blockTextLength = block.children ? getTotalTextLength(block.children) : 0;
      if (charsUsed + blockTextLength <= targetChars) {
        result.push(block);
        charsUsed += blockTextLength;
      }
      continue;
    }

    if (block.type === 'image' || block.type === 'linebreak' || block.type === 'br') {
      result.push(block);
      continue;
    }

    // Text-based blocks reveal character-by-character
    if (block.type === 'text' || block.type === 'bold' || block.type === 'italic' || block.type === 'colored') {
      const blockLength = block.content.length;
      const remainingChars = targetChars - charsUsed;

      if (remainingChars >= blockLength) {
        // Include entire block
        result.push(block);
        charsUsed += blockLength;
      } else {
        // Include partial block
        result.push({
          ...block,
          content: block.content.slice(0, remainingChars),
        });
        charsUsed += remainingChars;
        break;
      }
    }
  }

  return { blocks: result, charsUsed };
}

export function TypewriterText({ text, speed = 3, className, skipAnimation = false, onComplete }: TypewriterTextProps) {
  const parsedPages = useMemo(() => parseRichText(text), [text]);
  const blocks = parsedPages[0]?.blocks || [];
  const totalChars = useMemo(() => getTotalTextLength(blocks), [blocks]);

  // Capture initial skipAnimation value for this text
  const shouldSkipRef = useRef(skipAnimation);
  const prevTextRef = useRef(text);

  // Update ref when text changes
  if (prevTextRef.current !== text) {
    shouldSkipRef.current = skipAnimation;
    prevTextRef.current = text;
  }

  const [visibleChars, setVisibleChars] = useState(shouldSkipRef.current ? totalChars : 0);
  const [isComplete, setIsComplete] = useState(shouldSkipRef.current);

  useEffect(() => {
    // Reset when text or totalChars changes
    if (shouldSkipRef.current) {
      setVisibleChars(totalChars);
      setIsComplete(true);
    } else {
      setVisibleChars(0);
      setIsComplete(false);
    }
  }, [text, totalChars]);

  useEffect(() => {
    if (shouldSkipRef.current) {
      // If skipping, call onComplete immediately
      if (onComplete && !isComplete) {
        onComplete();
      }
      return;
    }

    if (visibleChars < totalChars) {
      const timeout = setTimeout(() => {
        setVisibleChars(visibleChars + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (visibleChars >= totalChars && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [visibleChars, totalChars, speed, isComplete, onComplete]);

  const { blocks: visibleBlocks } = getPartialBlocks(blocks, visibleChars);

  // Add cursor as a text block if still animating
  const blocksWithCursor = [...visibleBlocks];
  if (!isComplete && !shouldSkipRef.current) {
    blocksWithCursor.push({
      type: 'text',
      content: '▊' // Block cursor character
    });
  }

  return (
    <div className={className}>
      <RichText blocks={blocksWithCursor} />
    </div>
  );
}
