'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface JsonExportProps {
  text: string
}

export default function JsonExport({ text }: JsonExportProps) {
  const [copied, setCopied] = useState(false)

  const jsonString = JSON.stringify(text)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          JSON-ready string (properly escaped)
        </div>
        <Button
          size="sm"
          variant={copied ? 'default' : 'outline'}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy JSON
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border">
          <code>{jsonString}</code>
        </pre>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Usage in hunt JSON:</p>
        <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
          <code>{`"location_riddle": ${jsonString.substring(0, 50)}...`}</code>
        </pre>
        <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto mt-1">
          <code>{`"location_found_text": ${jsonString.substring(0, 50)}...`}</code>
        </pre>
      </div>
    </div>
  )
}
