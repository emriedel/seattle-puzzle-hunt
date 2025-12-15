/**
 * Text Parser for Custom Rich Text Syntax
 *
 * Supported syntax:
 * - {{handwritten}}text{{/handwritten}} - Default handwriting (supports nested formatting)
 * - {{handwritten:style}}text{{/handwritten}} - Styled handwriting (scrawl, elegant, graffiti)
 * - **bold** - Bold text
 * - *italic* - Italic text
 * - {{color:name}}text{{/color}} - Colored text
 * - {{image:/path}} - Inline image
 * - \n - Line breaks
 */

export type TextBlockType =
  | 'text'
  | 'handwritten'
  | 'bold'
  | 'italic'
  | 'colored'
  | 'image'
  | 'linebreak'
  | 'br';

export type HandwritingStyle = 'default' | 'scrawl' | 'elegant' | 'graffiti';

export interface TextBlock {
  type: TextBlockType;
  content: string;
  style?: HandwritingStyle;
  color?: string;
  children?: TextBlock[];
}

export interface Page {
  blocks: TextBlock[];
}

/**
 * Split text into pages (pagination removed - always returns single page)
 * ---PAGE--- markers are now ignored and removed from the text
 */
export function splitIntoPages(text: string): string[] {
  // Remove all ---PAGE--- markers and return as single page
  const cleanedText = text.replace(/---PAGE---/g, '\n\n').trim();
  return cleanedText.length > 0 ? [cleanedText] : [];
}

/**
 * Parse a single page of text into structured blocks
 */
export function parseTextBlocks(text: string, depth: number = 0): TextBlock[] {
  const startTime = performance.now();
  const blocks: TextBlock[] = [];
  let currentIndex = 0;
  const maxDepth = 3; // Prevent infinite recursion
  const maxIterations = 10000; // Safety limit
  let iterations = 0;

  // Prevent infinite recursion in nested handwritten blocks
  if (depth > maxDepth) {
    console.warn('[parseTextBlocks] Max recursion depth reached, returning plain text');
    return [{ type: 'text', content: text }];
  }

  // Log parsing for large texts
  if (text.length > 1000 && depth === 0) {
    console.log(`[parseTextBlocks] Starting parse of ${text.length} chars`);
  }

  while (currentIndex < text.length && iterations < maxIterations) {
    iterations++;

    // Warn if a single parse is taking too long
    if (iterations % 1000 === 0) {
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) {
        console.warn(`[parseTextBlocks] Slow parse: ${elapsed.toFixed(0)}ms after ${iterations} iterations, index ${currentIndex}/${text.length}`);
      }
    }
    // Check for handwritten block
    const handwrittenMatch = text.slice(currentIndex).match(/^\{\{handwritten(?::(\w+))?\}\}(.*?)\{\{\/handwritten\}\}/s);
    if (handwrittenMatch) {
      const style = (handwrittenMatch[1] || 'default') as HandwritingStyle;
      const content = handwrittenMatch[2];
      // Recursively parse the content to support nested formatting
      const children = parseTextBlocks(content, depth + 1);
      blocks.push({
        type: 'handwritten',
        content: '', // Content is now in children
        style,
        children,
      });
      currentIndex += handwrittenMatch[0].length;
      continue;
    }

    // Check for colored text
    const colorMatch = text.slice(currentIndex).match(/^\{\{color:(\w+)\}\}(.*?)\{\{\/color\}\}/s);
    if (colorMatch) {
      const color = colorMatch[1];
      const content = colorMatch[2];
      blocks.push({
        type: 'colored',
        content: content.trim(),
        color,
      });
      currentIndex += colorMatch[0].length;
      continue;
    }

    // Check for image
    const imageMatch = text.slice(currentIndex).match(/^\{\{image:(.*?)\}\}/);
    if (imageMatch) {
      blocks.push({
        type: 'image',
        content: imageMatch[1].trim(),
      });
      currentIndex += imageMatch[0].length;
      continue;
    }

    // Check for line break (double newline = paragraph break)
    if (text.slice(currentIndex).startsWith('\n\n')) {
      blocks.push({
        type: 'linebreak',
        content: '',
      });
      currentIndex += 2;
      continue;
    }

    // Check for single line break
    if (text.slice(currentIndex).startsWith('\n')) {
      blocks.push({
        type: 'br',
        content: '',
      });
      currentIndex += 1;
      continue;
    }

    // Parse inline formatting (bold, italic)
    const inlineText = parseInlineFormatting(text, currentIndex);
    if (inlineText) {
      blocks.push(...inlineText.blocks);
      currentIndex = inlineText.newIndex;
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecialIndex = findNextSpecial(text, currentIndex);
    const plainText = text.slice(currentIndex, nextSpecialIndex);
    if (plainText.length > 0) {
      blocks.push({
        type: 'text',
        content: plainText,
      });
    }

    // CRITICAL: Always advance at least 1 character to prevent infinite loops
    if (nextSpecialIndex === currentIndex) {
      // We found a special character but couldn't parse it
      // Treat it as plain text and move forward
      blocks.push({
        type: 'text',
        content: text.charAt(currentIndex),
      });
      currentIndex++;
    } else {
      currentIndex = nextSpecialIndex;
    }
  }

  if (iterations >= maxIterations) {
    console.error(`[parseTextBlocks] Max iterations reached (${maxIterations}). Possible infinite loop detected. Text length: ${text.length}`);
  }

  return blocks;
}

/**
 * Parse inline formatting like **bold** and *italic*
 */
function parseInlineFormatting(text: string, startIndex: number): { blocks: TextBlock[], newIndex: number } | null {
  const remaining = text.slice(startIndex);

  // Check for bold **text**
  const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
  if (boldMatch) {
    return {
      blocks: [{
        type: 'bold',
        content: boldMatch[1],
      }],
      newIndex: startIndex + boldMatch[0].length,
    };
  }

  // Check for italic *text*
  const italicMatch = remaining.match(/^\*(.+?)\*/);
  if (italicMatch) {
    return {
      blocks: [{
        type: 'italic',
        content: italicMatch[1],
      }],
      newIndex: startIndex + italicMatch[0].length,
    };
  }

  return null;
}

/**
 * Find the next special character or block marker
 */
function findNextSpecial(text: string, startIndex: number): number {
  const remaining = text.slice(startIndex);
  const specialPatterns = [
    /\{\{/,  // Block start
    /\*\*/,  // Bold
    /\*/,    // Italic (single asterisk)
    /\n/,    // Line break
  ];

  let minIndex = text.length;
  for (const pattern of specialPatterns) {
    const match = remaining.match(pattern);
    if (match && match.index !== undefined) {
      const absoluteIndex = startIndex + match.index;
      if (absoluteIndex < minIndex) {
        minIndex = absoluteIndex;
      }
    }
  }

  return minIndex;
}

/**
 * Main parsing function: split into pages and parse each page
 */
export function parseRichText(text: string): Page[] {
  if (!text) return [{ blocks: [] }];

  const pageTexts = splitIntoPages(text);
  return pageTexts.map(pageText => ({
    blocks: parseTextBlocks(pageText),
  }));
}
