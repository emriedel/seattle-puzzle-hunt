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
  Home,
  List,
  LogOut,
  RotateCcw,
  MapPin,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

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
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  const handleExitHunt = () => {
    if (onExitHunt) {
      onExitHunt();
    }
    onOpenChange(false);
  };

  const handleRestartConfirm = () => {
    setShowRestartDialog(false);
    if (onRestartHunt) {
      onRestartHunt();
    }
    onOpenChange(false);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  const handleViewLocation = (locationId: string) => {
    if (onViewLocation) {
      onViewLocation(locationId);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleExitHunt}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Exit Hunt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowRestartDialog(true)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart
                  </Button>
                </div>
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

            {/* Hunt Switcher */}
            {allHunts.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Other Hunts
                  </h3>
                  <div className="space-y-1">
                    {allHunts
                      .filter((hunt) => hunt.id !== currentHunt?.id)
                      .map((hunt) => (
                        <button
                          key={hunt.id}
                          onClick={() => handleNavigate(`/hunts/${hunt.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{hunt.title}</p>
                            <p className="text-xs text-muted-foreground">{hunt.neighborhood}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Navigation Links */}
            <Separator />
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/hunts")}
              >
                <List className="w-4 h-4 mr-2" />
                All Hunts
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Restart Confirmation Dialog */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Hunt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your progress and start the hunt from the beginning.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestartConfirm}>
              Restart Hunt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
