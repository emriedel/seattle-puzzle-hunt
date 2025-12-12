import React, { useMemo } from 'react';
import { RichText } from '@/components/RichText';
import { parseRichText } from '@/lib/text-parser';

interface TextPaginationProps {
  text: string;
  className?: string;
}

/**
 * TextPagination component - renders parsed rich text
 * (Pagination feature removed - always renders single page)
 */
export function TextPagination({ text, className = '' }: TextPaginationProps) {
  // Memoize parsing to avoid re-parsing on every render
  const pages = useMemo(() => {
    const startTime = performance.now();
    const result = parseRichText(text);
    const duration = performance.now() - startTime;

    // Log slow parses (>50ms) to help debug performance issues
    if (duration > 50) {
      console.warn(`[TextPagination] Slow parse: ${duration.toFixed(2)}ms for ${text.length} chars`);
    }

    return result;
  }, [text]);

  // Safety check: if no pages, return empty div
  if (!pages || pages.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <RichText blocks={pages[0].blocks} />
    </div>
  );
}
