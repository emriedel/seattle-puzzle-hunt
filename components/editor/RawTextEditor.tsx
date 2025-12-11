'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface RawTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export interface RawTextEditorHandle {
  insertText: (before: string, after?: string) => void
}

const RawTextEditor = forwardRef<RawTextEditorHandle, RawTextEditorProps>(
  ({ value, onChange }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
      insertText: (before: string, after: string = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = value.substring(start, end)

        let newText: string
        let newCursorPos: number

        if (selectedText) {
          // Wrap selected text
          newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
          newCursorPos = start + before.length + selectedText.length + after.length
        } else {
          // Insert at cursor with placeholder
          const placeholder = after ? 'text' : ''
          newText = value.substring(0, start) + before + placeholder + after + value.substring(start)
          newCursorPos = start + before.length
        }

        onChange(newText)

        // Restore focus and cursor position safely
        requestAnimationFrame(() => {
          const currentTextarea = textareaRef.current
          if (currentTextarea && document.activeElement !== currentTextarea) {
            try {
              currentTextarea.focus()
              currentTextarea.setSelectionRange(newCursorPos, newCursorPos)
            } catch (err) {
              // Silently fail if selection range is invalid
              console.warn('Failed to set cursor position:', err)
            }
          }
        })
      },
    }))

    return (
      <div className="relative">
        <div className="text-xs text-muted-foreground mb-1 px-1">
          Raw Text (with formatting syntax)
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
          placeholder="Type your text here or use the toolbar to add formatting..."
          spellCheck={false}
        />
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {value.length} characters
        </div>
      </div>
    )
  }
)

RawTextEditor.displayName = 'RawTextEditor'

export default RawTextEditor
