/**
 * Text Parser for Custom Rich Text Syntax
 *
 * Supported syntax:
 * - {{handwritten}}text{{/handwritten}} - Default handwriting
 * - {{handwritten:style}}text{{/handwritten}} - Styled handwriting (scrawl, elegant, graffiti)
 * - **bold** - Bold text
 * - *italic* - Italic text
 * - {{color:name}}text{{/color}} - Colored text
 * - {{image:/path}} - Inline image
 * - \n - Line breaks
 * - ---PAGE--- - Page break marker
 */

export type TextBlockType =
  | 'text'
  | 'handwritten'
  | 'bold'
  | 'italic'
  | 'colored'
  | 'image'
  | 'linebreak';

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
 * Split text into pages based on ---PAGE--- markers
 */
export function splitIntoPages(text: string): string[] {
  return text.split('---PAGE---').map(page => page.trim()).filter(page => page.length > 0);
}

/**
 * Parse a single page of text into structured blocks
 */
export function parseTextBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Check for handwritten block
    const handwrittenMatch = text.slice(currentIndex).match(/^\{\{handwritten(?::(\w+))?\}\}(.*?)\{\{\/handwritten\}\}/s);
    if (handwrittenMatch) {
      const style = (handwrittenMatch[1] || 'default') as HandwritingStyle;
      const content = handwrittenMatch[2];
      blocks.push({
        type: 'handwritten',
        content: content.trim(),
        style,
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
      currentIndex += 1;
      continue; // Skip single newlines
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
    const plainText = text.slice(currentIndex, nextSpecialIndex).trim();
    if (plainText.length > 0) {
      blocks.push({
        type: 'text',
        content: plainText,
      });
    }
    currentIndex = nextSpecialIndex;
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
