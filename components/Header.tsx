"use client";

import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({
  title = "Seattle Puzzle Hunt",
  showBackButton = false,
  backHref = "/hunts",
  backLabel = "Back",
  onMenuClick,
  showMenu = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 px-4">
        <div className="relative flex items-center justify-center h-full">
          {/* Left: Back button */}
          {showBackButton && backHref && (
            <div className="absolute left-0">
              <Link
                href={backHref}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            </div>
          )}

          {/* Center: Title - truly centered */}
          <h1 className="text-sm sm:text-base font-semibold truncate max-w-[60%]">
            {title}
          </h1>

          {/* Right: Menu button */}
          {showMenu && onMenuClick && (
            <div className="absolute right-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
