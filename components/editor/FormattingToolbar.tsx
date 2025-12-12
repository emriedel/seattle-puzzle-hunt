'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Image as ImageIcon,
  Palette,
  PenTool,
  Pilcrow
} from 'lucide-react'

interface FormattingToolbarProps {
  onFormat: (formatType: string, value?: string) => void
}

export default function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 border-b">
      {/* Text Formatting */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFormat('bold')}
          title="Bold (wrap with **)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFormat('italic')}
          title="Italic (wrap with *)"
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>

      {/* Handwriting Styles */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <PenTool className="h-4 w-4 mr-1" />
            Handwriting
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFormat('handwritten', 'default')}>
            <span className="font-handwritten">Default</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('handwritten', 'scrawl')}>
            <span className="font-handwritten-scrawl">Scrawl</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('handwritten', 'elegant')}>
            <span className="font-handwritten-elegant">Elegant</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('handwritten', 'graffiti')}>
            <span className="font-handwritten-graffiti">Graffiti</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Colors */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-1" />
            Color
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFormat('color', 'red')}>
            <span className="text-red-500">Red</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('color', 'blue')}>
            <span className="text-blue-500">Blue</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('color', 'green')}>
            <span className="text-green-500">Green</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('color', 'yellow')}>
            <span className="text-yellow-500">Yellow</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('color', 'orange')}>
            <span className="text-orange-500">Orange</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat('color', 'purple')}>
            <span className="text-purple-500">Purple</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Special Inserts */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFormat('image')}
          title="Insert image"
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFormat('paragraph')}
          title="Insert paragraph break"
        >
          <Pilcrow className="h-4 w-4 mr-1" />
          Paragraph
        </Button>
      </div>
    </div>
  )
}
