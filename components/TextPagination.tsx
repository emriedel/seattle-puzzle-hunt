'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RichText } from '@/components/RichText';
import { parseRichText, Page } from '@/lib/text-parser';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TextPaginationProps {
  text: string;
  className?: string;
}

/**
 * TextPagination component - handles multi-page text with navigation
 */
export function TextPagination({ text, className = '' }: TextPaginationProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Parse text into pages
  const pages = parseRichText(text);

  // If only one page, don't show pagination UI
  if (pages.length === 1) {
    return (
      <div className={className}>
        <RichText blocks={pages[0].blocks} />
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const hasPrevious = currentPageIndex > 0;
  const hasNext = currentPageIndex < pages.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <div className={className}>
      {/* Page content */}
      <div className="min-h-[200px]">
        <RichText blocks={currentPage.blocks} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Page {currentPageIndex + 1} of {pages.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={!hasNext}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
