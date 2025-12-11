"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TextPagination } from "@/components/TextPagination";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface LocationData {
  id: string;
  name: string;
  order: number;
  narrativeSnippet: string;
  locationFoundText: string;
  puzzleType: string;
  puzzlePrompt: string;
  puzzleAnswer: string;
  puzzleSuccessText: string;
  nextRiddle: string;
}

interface LocationHistoryViewerProps {
  location: LocationData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationHistoryViewer({
  location,
  open,
  onOpenChange,
}: LocationHistoryViewerProps) {
  if (!location) return null;

  // Format puzzle type for display
  const getPuzzleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "number_code.cryptex": "Numeric Cryptex",
      "number_code.safe": "Safe Dial",
      "word_code": "Letter Cryptex",
      "tile_word": "Tile Word",
      "directional_code": "Directional Pad",
      "simon_code": "Simon Pattern",
      "morse_code": "Morse Code",
      "toggle_code": "Toggle Switches",
      "slide_puzzle": "Slide Puzzle",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <DialogTitle>{location.name}</DialogTitle>
          </div>
          <DialogDescription>
            Location {location.order} - Completed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Narrative/Clue Section */}
          {location.narrativeSnippet && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                INITIAL CLUE
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <TextPagination text={location.narrativeSnippet} />
              </div>
            </div>
          )}

          <Separator />

          {/* Location Found Text */}
          {location.locationFoundText && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                AT THE LOCATION
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <TextPagination text={location.locationFoundText} />
              </div>
            </div>
          )}

          <Separator />

          {/* Puzzle Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                PUZZLE
              </h3>
              <Badge variant="secondary">
                {getPuzzleTypeLabel(location.puzzleType)}
              </Badge>
            </div>

            {location.puzzlePrompt && (
              <div className="bg-muted/30 rounded-lg p-4 mb-3">
                <TextPagination text={location.puzzlePrompt} />
              </div>
            )}

            {location.puzzleAnswer && location.puzzleAnswer !== '***' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Answer:</p>
                <p className="font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                  {location.puzzleAnswer}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Success Text */}
          {location.puzzleSuccessText && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                PUZZLE SOLVED
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <TextPagination text={location.puzzleSuccessText} />
              </div>
            </div>
          )}

          {/* Next Riddle */}
          {location.nextRiddle && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  NEXT CLUE
                </h3>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <TextPagination text={location.nextRiddle} />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
