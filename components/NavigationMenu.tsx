"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  List,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface Hunt {
  id: string;
  title: string;
  neighborhood: string;
}

interface CompletedLocation {
  id: string;
  name: string;
  order: number;
}

interface NavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Current hunt context (optional - only when in a hunt)
  currentHunt?: {
    id: string;
    title: string;
    progress?: {
      current: number;
      total: number;
    };
  };

  // Completed locations (for history)
  completedLocations?: CompletedLocation[];

  // Available hunts (for switcher)
  allHunts?: Hunt[];

  // Action handlers
  onExitHunt?: () => void;
  onRestartHunt?: () => void;
  onViewLocation?: (locationId: string) => void;
}

export function NavigationMenu({
  open,
  onOpenChange,
  currentHunt,
  completedLocations = [],
  allHunts = [],
  onExitHunt,
  onRestartHunt,
  onViewLocation,
}: NavigationMenuProps) {
  const router = useRouter();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const handleNavigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  const handleViewLocation = (locationId: string) => {
    if (onViewLocation) {
      onViewLocation(locationId);
    }
  };

  const handleConfirmRestart = () => {
    // Clear session ID
    localStorage.removeItem('current-session-id');

    // Clear hunt progress data
    if (currentHunt) {
      const progressKey = `hunt-progress-${currentHunt.id}`;
      localStorage.removeItem(progressKey);
    }

    setShowRestartConfirm(false);
    if (currentHunt) {
      handleNavigate(`/hunts/${currentHunt.id}`);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate hunts and view your progress
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Current Hunt Section */}
            {currentHunt && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Current Hunt
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">{currentHunt.title}</p>
                  {currentHunt.progress && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Progress: {currentHunt.progress.current} / {currentHunt.progress.total} locations
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowRestartConfirm(true)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </div>
            )}

            {/* Location History */}
            {completedLocations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Location History
                  </h3>
                  <div className="space-y-1">
                    {completedLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleViewLocation(location.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="flex-1 text-sm">{location.name}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Navigation Links */}
            {completedLocations.length > 0 && <Separator />}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/hunts")}
              >
                <List className="w-4 h-4 mr-2" />
                View All Hunts
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Hunt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all your progress on this hunt. You'll start from the beginning and all solved puzzles will be cleared. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestart}>
              Restart Hunt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
