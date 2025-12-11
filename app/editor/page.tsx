'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import FormattingToolbar from '@/components/editor/FormattingToolbar'
import RawTextEditor, { RawTextEditorHandle } from '@/components/editor/RawTextEditor'
import JsonExport from '@/components/editor/JsonExport'
import { TextPagination } from '@/components/TextPagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditorPage() {
  const [text, setText] = useState('')
  const [debouncedText, setDebouncedText] = useState('')
  const editorRef = useRef<RawTextEditorHandle>(null)

  // Debounce text updates for preview (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text)
    }, 300)

    return () => clearTimeout(timer)
  }, [text])

  // Memoize preview to avoid re-rendering on every keystroke
  const previewContent = useMemo(() => {
    if (!debouncedText) {
      return (
        <div className="min-h-[300px] border rounded-md p-4 flex items-center justify-center text-muted-foreground">
          Preview will appear here as you type...
        </div>
      )
    }
    return (
      <div className="min-h-[300px] border rounded-md p-4">
        <TextPagination text={debouncedText} />
      </div>
    )
  }, [debouncedText])

  const handleFormat = (formatType: string, value?: string) => {
    if (!editorRef.current) return

    switch (formatType) {
      case 'bold':
        editorRef.current.insertText('**', '**')
        break
      case 'italic':
        editorRef.current.insertText('*', '*')
        break
      case 'handwritten':
        if (value === 'default') {
          editorRef.current.insertText('{{handwritten}}', '{{/handwritten}}')
        } else {
          editorRef.current.insertText(`{{handwritten:${value}}}`, '{{/handwritten}}')
        }
        break
      case 'color':
        editorRef.current.insertText(`{{color:${value}}}`, '{{/color}}')
        break
      case 'image':
        editorRef.current.insertText('{{image:/puzzle-images/your-image.jpg}}')
        break
      case 'pagebreak':
        editorRef.current.insertText('\n\n---PAGE---\n\n')
        break
      case 'paragraph':
        editorRef.current.insertText('\n\n')
        break
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Text Editor for Hunt JSON</h1>
          <p className="text-muted-foreground">
            Create formatted text with rich formatting syntax, see a live preview, and export as JSON-ready strings.
          </p>
        </div>

        <div className="space-y-6">
          {/* Formatting Toolbar */}
          <Card>
            <CardContent className="p-0">
              <FormattingToolbar onFormat={handleFormat} />
            </CardContent>
          </Card>

          {/* Two-column layout for desktop, stacked for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw Text Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <RawTextEditor ref={editorRef} value={text} onChange={setText} />
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {previewContent}
              </CardContent>
            </Card>
          </div>

          {/* JSON Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export to JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonExport text={text} />
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Syntax Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Text Formatting</h3>
                  <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                    <li>**bold text**</li>
                    <li>*italic text*</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Handwriting</h3>
                  <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                    <li>{`{{handwritten}}text{{/handwritten}}`}</li>
                    <li>{`{{handwritten:scrawl}}text{{/handwritten}}`}</li>
                    <li>{`{{handwritten:elegant}}text{{/handwritten}}`}</li>
                    <li>{`{{handwritten:graffiti}}text{{/handwritten}}`}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Colors</h3>
                  <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                    <li>{`{{color:red}}text{{/color}}`}</li>
                    <li>{`{{color:blue}}text{{/color}}`}</li>
                    <li>Also: green, yellow, orange, purple</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Special</h3>
                  <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                    <li>{`{{image:/puzzle-images/file.jpg}}`}</li>
                    <li>---PAGE--- (page break)</li>
                    <li>\\n\\n (paragraph break)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
