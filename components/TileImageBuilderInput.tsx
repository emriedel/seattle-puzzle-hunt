'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface TileImageBuilderInputProps {
  images: string[]; // Array of image paths (e.g., ["/puzzle-images/step1.jpg", ...])
  slotCount?: number; // Number of answer slots (defaults to images.length)
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function TileImageBuilderInput({
  images,
  slotCount,
  onSubmit,
  disabled,
}: TileImageBuilderInputProps) {
  const answerSlots = slotCount || images.length;

  // Track which image indices are in which slots (null = empty slot)
  const [slots, setSlots] = useState<(number | null)[]>(Array(answerSlots).fill(null));

  // Track which image indices are still available in the pool
  const [availableImages, setAvailableImages] = useState<number[]>(
    images.map((_, i) => i)
  );

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'pool' | number | null>(null); // 'pool' or slot index

  // Touch dragging state
  const [touchDragging, setTouchDragging] = useState(false);
  const [dragPreviewPos, setDragPreviewPos] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<'pool' | number | null>(null);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const poolRef = useRef<HTMLDivElement | null>(null);

  // Desktop drag handlers
  const handleDragStart = (imageIndex: number, source: 'pool' | number) => {
    if (disabled) return;
    setDraggedIndex(imageIndex);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || dragSource === null) return;

    performDrop(targetSlot);
  };

  const handleDropToPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || dragSource === null) return;

    performDropToPool();
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent, imageIndex: number, source: 'pool' | number) => {
    if (disabled) return;
    e.preventDefault();

    setDraggedIndex(imageIndex);
    setDragSource(source);
    setTouchDragging(true);

    const touch = e.touches[0];
    setDragPreviewPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging || disabled) return;
    e.preventDefault();

    const touch = e.touches[0];
    setDragPreviewPos({ x: touch.clientX, y: touch.clientY });

    // Detect which drop zone we're over
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) {
      setDropTarget(null);
      return;
    }

    // Check if over a slot
    for (let i = 0; i < slotRefs.current.length; i++) {
      if (slotRefs.current[i]?.contains(element)) {
        setDropTarget(i);
        return;
      }
    }

    // Check if over pool
    if (poolRef.current?.contains(element)) {
      setDropTarget('pool');
      return;
    }

    setDropTarget(null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragging || disabled) return;
    e.preventDefault();

    if (dropTarget !== null) {
      if (dropTarget === 'pool') {
        performDropToPool();
      } else if (typeof dropTarget === 'number') {
        performDrop(dropTarget);
      }
    }

    // Reset touch state
    setTouchDragging(false);
    setDraggedIndex(null);
    setDragSource(null);
    setDropTarget(null);
  };

  // Shared drop logic
  const performDrop = (targetSlot: number) => {
    if (disabled || draggedIndex === null || dragSource === null) return;

    const newSlots = [...slots];
    const newAvailableImages = [...availableImages];

    // If dropping from pool
    if (dragSource === 'pool') {
      // If target slot is occupied, return that image to pool
      if (newSlots[targetSlot] !== null) {
        newAvailableImages.push(newSlots[targetSlot]!);
      }

      // Remove image from pool and place in slot
      const imgIndex = newAvailableImages.indexOf(draggedIndex);
      if (imgIndex > -1) {
        newAvailableImages.splice(imgIndex, 1);
      }
      newSlots[targetSlot] = draggedIndex;
    }
    // If dropping from another slot
    else if (typeof dragSource === 'number') {
      // Swap the images
      const temp = newSlots[targetSlot];
      newSlots[targetSlot] = draggedIndex;
      newSlots[dragSource] = temp;
    }

    setSlots(newSlots);
    setAvailableImages(newAvailableImages);
    setDraggedIndex(null);
    setDragSource(null);
  };

  const performDropToPool = () => {
    if (disabled || draggedIndex === null || dragSource === null) return;

    // Only allow dropping back to pool from a slot
    if (typeof dragSource === 'number') {
      const newSlots = [...slots];
      const newAvailableImages = [...availableImages];

      newSlots[dragSource] = null;
      newAvailableImages.push(draggedIndex);

      setSlots(newSlots);
      setAvailableImages(newAvailableImages);
    }

    setDraggedIndex(null);
    setDragSource(null);
  };

  const resetTiles = () => {
    if (disabled) return;
    setSlots(Array(answerSlots).fill(null));
    setAvailableImages(images.map((_, i) => i));
  };

  const handleSubmit = () => {
    if (disabled) return;
    // Convert slots to answer string (one-based indices)
    const answer = slots
      .filter(idx => idx !== null)
      .map(idx => (idx! + 1).toString())
      .join(',');
    onSubmit(answer);
  };

  const isComplete = slots.every(slot => slot !== null);

  return (
    <div
      className="flex flex-col items-center gap-6 py-4 w-full max-w-2xl"
      style={{ touchAction: 'none' }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Answer slots */}
      <div className="w-full">
        <div className="flex gap-3 justify-center flex-wrap">
          {slots.map((imageIndex, index) => (
            <div
              key={index}
              ref={(el) => { slotRefs.current[index] = el; }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                w-20 h-20 rounded-lg border-2 border-dashed
                flex items-center justify-center
                transition-colors
                ${imageIndex !== null
                  ? 'border-primary bg-primary/10'
                  : 'border-muted bg-muted/10'
                }
                ${dropTarget === index ? 'ring-2 ring-primary ring-offset-2' : ''}
              `}
            >
              {imageIndex !== null ? (
                <div
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(imageIndex, index)}
                  onTouchStart={(e) => handleTouchStart(e, imageIndex, index)}
                  className="w-full h-full flex items-center justify-center cursor-move p-1 select-none"
                  style={{ opacity: touchDragging && dragSource === index ? 0.3 : 1 }}
                >
                  <div className="w-full h-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={images[imageIndex]}
                      alt={`Image ${imageIndex + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full pointer-events-none select-none"
                      draggable={false}
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <span className="text-2xl text-muted-foreground/30 select-none">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image pool */}
      <div className="w-full">
        <div
          ref={poolRef}
          onDragOver={handleDragOver}
          onDrop={handleDropToPool}
          className={`min-h-24 p-4 rounded-lg border-2 border-dashed border-muted bg-muted/5 flex items-center justify-center flex-wrap gap-3 transition-colors ${
            dropTarget === 'pool' ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
        >
          {availableImages.length === 0 ? (
            <span className="text-muted-foreground italic">All images placed!</span>
          ) : (
            availableImages.map((imageIndex) => (
              <div
                key={`pool-${imageIndex}`}
                draggable={!disabled}
                onDragStart={() => handleDragStart(imageIndex, 'pool')}
                onTouchStart={(e) => handleTouchStart(e, imageIndex, 'pool')}
                className="w-20 h-20 flex items-center justify-center cursor-move select-none p-1"
                style={{ opacity: touchDragging && draggedIndex === imageIndex && dragSource === 'pool' ? 0.3 : 1 }}
              >
                <div className="w-full h-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={images[imageIndex]}
                    alt={`Image ${imageIndex + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full pointer-events-none select-none"
                    draggable={false}
                    unoptimized
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Touch drag preview */}
      {touchDragging && draggedIndex !== null && (
        <div
          className="fixed pointer-events-none z-50 w-20 h-20"
          style={{
            left: dragPreviewPos.x - 40,
            top: dragPreviewPos.y - 40,
            opacity: 0.8,
          }}
        >
          <div className="w-full h-full flex items-center justify-center shadow-2xl bg-white dark:bg-slate-800 overflow-hidden rounded-lg border-2 border-primary">
            <Image
              src={images[draggedIndex]}
              alt={`Dragging ${draggedIndex + 1}`}
              width={80}
              height={80}
              className="object-cover w-full h-full select-none"
              draggable={false}
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3 w-full max-w-xs justify-center">
        <Button
          onClick={resetTiles}
          disabled={disabled || (slots.every(s => s === null) && availableImages.length === images.length)}
          variant="outline"
          className="w-auto px-8"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={disabled || !isComplete}
          size="lg"
          variant="secondary"
          className="w-auto px-12"
        >
          {disabled ? 'Checking...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
