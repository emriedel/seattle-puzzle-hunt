'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import FormattingToolbar from '@/components/editor/FormattingToolbar'
import RawTextEditor, { RawTextEditorHandle } from '@/components/editor/RawTextEditor'
import { TextPagination } from '@/components/TextPagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HuntSelector } from '@/components/editor/HuntSelector'
import { HuntMetadataForm } from '@/components/editor/HuntMetadataForm'
import { LocationList } from '@/components/editor/LocationList'
import { LocationEditor } from '@/components/editor/LocationEditor'

interface ColorConfig {
  code: string;
  color: string;
  label: string;
}

interface PuzzleData {
  type: string;
  answer: string | number[];
  answer_length: number;
  colors?: ColorConfig[];
  images?: string[];
  image?: string;
}

interface LocationData {
  id: string;
  name: string;
  address?: string;
  order: number;
  coordinates: { lat: number; lng: number };
  location_riddle: string;
  location_found_text: string;
  search_location_button_text?: string;
  puzzle: PuzzleData;
  next_location_id: string | null;
}

interface HuntData {
  id: string;
  title: string;
  neighborhood: string;
  description?: string;
  hunt_intro_text?: string;
  hunt_success_text?: string;
  estimated_time_minutes: number;
  global_location_radius_meters?: number;
  locations: LocationData[];
}

type FocusedField = {
  type: 'hunt_intro' | 'hunt_success' | 'location_riddle' | 'location_found' | 'none';
  locationIndex?: number;
}

export default function EditorPage() {
  // Hunt state
  const [huntData, setHuntData] = useState<HuntData | null>(null)
  const [currentFilename, setCurrentFilename] = useState<string | null>(null)
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Focus tracking for preview
  const [focusedField, setFocusedField] = useState<FocusedField>({ type: 'none' })
  const [debouncedPreviewText, setDebouncedPreviewText] = useState('')
  const [previewOffset, setPreviewOffset] = useState(0)

  // Refs for formatting toolbar to interact with
  const editorRefs = useRef<Map<string, RawTextEditorHandle>>(new Map())
  const focusedElementRef = useRef<HTMLElement | null>(null)

  // Get the current text being previewed
  const getCurrentPreviewText = useCallback(() => {
    if (!huntData) return ''

    switch (focusedField.type) {
      case 'hunt_intro':
        return huntData.hunt_intro_text || ''
      case 'hunt_success':
        return huntData.hunt_success_text || ''
      case 'location_riddle':
        if (focusedField.locationIndex !== undefined && huntData.locations[focusedField.locationIndex]) {
          return huntData.locations[focusedField.locationIndex].location_riddle
        }
        return ''
      case 'location_found':
        if (focusedField.locationIndex !== undefined && huntData.locations[focusedField.locationIndex]) {
          return huntData.locations[focusedField.locationIndex].location_found_text
        }
        return ''
      default:
        return ''
    }
  }, [huntData, focusedField])

  // Debounce preview updates
  useEffect(() => {
    const text = getCurrentPreviewText()
    const timer = setTimeout(() => {
      setDebouncedPreviewText(text)
    }, 300)

    return () => clearTimeout(timer)
  }, [getCurrentPreviewText])

  // Update preview position when focused field changes
  useEffect(() => {
    const updatePreviewPosition = () => {
      if (focusedElementRef.current && focusedField.type !== 'none') {
        const rect = focusedElementRef.current.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const elementTop = rect.top + scrollTop

        // Calculate offset relative to the container
        setPreviewOffset(Math.max(0, elementTop - 200))
      }
    }

    updatePreviewPosition()

    // Update on scroll
    window.addEventListener('scroll', updatePreviewPosition)
    window.addEventListener('resize', updatePreviewPosition)

    return () => {
      window.removeEventListener('scroll', updatePreviewPosition)
      window.removeEventListener('resize', updatePreviewPosition)
    }
  }, [focusedField])

  // Track unsaved changes
  useEffect(() => {
    if (saveStatus === 'saved') {
      setHasUnsavedChanges(false)
    } else if (saveStatus === 'idle' && huntData) {
      setHasUnsavedChanges(true)
    }
  }, [huntData, saveStatus])

  // Warn before closing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Preview content
  const previewContent = useMemo(() => {
    if (focusedField.type === 'none' || !debouncedPreviewText) {
      return (
        <div className="min-h-[300px] border rounded-md p-4 flex items-center justify-center text-muted-foreground">
          Click on a text field to see a live preview here...
        </div>
      )
    }
    return (
      <div className="min-h-[300px] border rounded-md p-4">
        <TextPagination text={debouncedPreviewText} />
      </div>
    )
  }, [debouncedPreviewText, focusedField.type])

  // Get the focused field's label
  const getFocusedFieldLabel = () => {
    switch (focusedField.type) {
      case 'hunt_intro':
        return 'Hunt Intro Text'
      case 'hunt_success':
        return 'Hunt Success Text'
      case 'location_riddle':
        return `Location Riddle (${huntData?.locations[focusedField.locationIndex!]?.name || 'Unknown'})`
      case 'location_found':
        return `Location Found Text (${huntData?.locations[focusedField.locationIndex!]?.name || 'Unknown'})`
      default:
        return 'No field selected'
    }
  }

  const handleFormat = useCallback((formatType: string, value?: string) => {
    // Get the appropriate editor ref based on focused field
    let editorKey = ''
    if (focusedField.type === 'hunt_intro') editorKey = 'hunt_intro'
    else if (focusedField.type === 'hunt_success') editorKey = 'hunt_success'
    else if (focusedField.type === 'location_riddle' && focusedField.locationIndex !== undefined) {
      editorKey = `location_${focusedField.locationIndex}_riddle`
    } else if (focusedField.type === 'location_found' && focusedField.locationIndex !== undefined) {
      editorKey = `location_${focusedField.locationIndex}_found`
    }

    const editorRef = editorRefs.current.get(editorKey)
    if (!editorRef) return

    switch (formatType) {
      case 'bold':
        editorRef.insertText('**', '**')
        break
      case 'italic':
        editorRef.insertText('*', '*')
        break
      case 'handwritten':
        if (value === 'default') {
          editorRef.insertText('{{handwritten}}', '{{/handwritten}}')
        } else {
          editorRef.insertText(`{{handwritten:${value}}}`, '{{/handwritten}}')
        }
        break
      case 'color':
        editorRef.insertText(`{{color:${value}}}`, '{{/color}}')
        break
      case 'image':
        editorRef.insertText('{{image:/puzzle-images/your-image.jpg}}')
        break
      case 'paragraph':
        editorRef.insertText('\n\n')
        break
    }
  }, [focusedField])

  // Hunt handlers
  const handleHuntSelected = (hunt: any, filename: string) => {
    setHuntData(hunt)
    setCurrentFilename(filename)
    setSelectedLocationIndex(hunt.locations.length > 0 ? 0 : null)
    setSaveStatus('saved')
    setHasUnsavedChanges(false)
    setFocusedField({ type: 'none' })
  }

  const handleNewHunt = () => {
    const newHunt: HuntData = {
      id: 'new_hunt',
      title: 'New Hunt',
      neighborhood: 'Neighborhood',
      description: '',
      hunt_intro_text: '',
      hunt_success_text: '',
      estimated_time_minutes: 90,
      global_location_radius_meters: 40,
      locations: [],
    }
    setHuntData(newHunt)
    setCurrentFilename('new_hunt.json')
    setSelectedLocationIndex(null)
    setSaveStatus('idle')
    setHasUnsavedChanges(true)
    setFocusedField({ type: 'none' })
  }

  const handleMetadataChange = (metadata: any) => {
    if (!huntData) return
    setHuntData({
      ...huntData,
      ...metadata,
    })
    setSaveStatus('idle')
  }

  const handleLocationChange = (index: number, location: LocationData) => {
    if (!huntData) return
    const newLocations = [...huntData.locations]
    newLocations[index] = location
    setHuntData({
      ...huntData,
      locations: newLocations,
    })
    setSaveStatus('idle')
  }

  const handleAddLocation = () => {
    if (!huntData) return
    const newLocation: LocationData = {
      id: `location-${huntData.locations.length + 1}`,
      name: 'New Location',
      address: '',
      order: huntData.locations.length + 1,
      coordinates: { lat: 47.6540, lng: -122.3476 },
      location_riddle: '',
      location_found_text: '',
      search_location_button_text: '',
      puzzle: {
        type: 'word_code',
        answer: 'BOOK',
        answer_length: 4,
      },
      next_location_id: null,
    }
    setHuntData({
      ...huntData,
      locations: [...huntData.locations, newLocation],
    })
    setSelectedLocationIndex(huntData.locations.length)
    setSaveStatus('idle')
  }

  const handleRemoveLocation = (index: number) => {
    if (!huntData) return
    const newLocations = huntData.locations.filter((_, i) => i !== index)
    newLocations.forEach((loc, i) => {
      loc.order = i + 1
    })
    setHuntData({
      ...huntData,
      locations: newLocations,
    })
    if (selectedLocationIndex === index) {
      setSelectedLocationIndex(newLocations.length > 0 ? 0 : null)
    } else if (selectedLocationIndex !== null && selectedLocationIndex > index) {
      setSelectedLocationIndex(selectedLocationIndex - 1)
    }
    setSaveStatus('idle')
  }

  const handleMoveLocation = (index: number, direction: 'up' | 'down') => {
    if (!huntData) return
    const newLocations = [...huntData.locations]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newLocations.length) return

    [newLocations[index], newLocations[targetIndex]] = [newLocations[targetIndex], newLocations[index]]
    newLocations.forEach((loc, i) => {
      loc.order = i + 1
    })
    setHuntData({
      ...huntData,
      locations: newLocations,
    })
    setSelectedLocationIndex(targetIndex)
    setSaveStatus('idle')
  }

  const handleSaveHunt = async () => {
    if (!huntData || !currentFilename) return

    setSaveStatus('saving')
    try {
      const response = await fetch(`/api/editor/hunts/${huntData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hunt: huntData,
          filename: currentFilename,
        }),
      })

      if (response.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDownloadJSON = () => {
    if (!huntData) return
    const json = JSON.stringify(huntData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentFilename || 'hunt.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Hunt Editor</h1>
          <p className="text-muted-foreground">
            Create and edit hunts with rich text formatting and live preview.
          </p>
        </div>

        {/* Hunt Selector */}
        <HuntSelector onHuntSelected={handleHuntSelected} onNewHunt={handleNewHunt} />

        {huntData ? (
          <div className="mt-6 flex flex-col lg:flex-row gap-6">
            {/* Left Column: Main Editor */}
            <div className="flex-1 space-y-6">
              {/* Save Controls */}
              <div className="flex gap-4 items-center">
                <Button onClick={handleSaveHunt} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Hunt'}
                </Button>
                <Button variant="outline" onClick={handleDownloadJSON}>
                  Download JSON
                </Button>
                {saveStatus === 'error' && (
                  <span className="text-red-600">Error saving hunt</span>
                )}
                <span className="text-sm text-muted-foreground">
                  Editing: {currentFilename}
                  {hasUnsavedChanges && saveStatus !== 'saving' && (
                    <span className="text-orange-600 ml-2">(unsaved changes)</span>
                  )}
                </span>
              </div>

              {/* Hunt Metadata */}
              <HuntMetadataForm
                metadata={huntData}
                onChange={handleMetadataChange}
                onFieldFocus={(field, element) => {
                  setFocusedField({ type: field as any })
                  if (element) focusedElementRef.current = element
                }}
                editorRefs={editorRefs}
              />

              {/* Location List */}
              <LocationList
                locations={huntData.locations}
                selectedIndex={selectedLocationIndex}
                onSelect={setSelectedLocationIndex}
                onAdd={handleAddLocation}
                onRemove={handleRemoveLocation}
                onMoveUp={(index) => handleMoveLocation(index, 'up')}
                onMoveDown={(index) => handleMoveLocation(index, 'down')}
              />

              {/* Location Editor */}
              {selectedLocationIndex !== null && huntData.locations[selectedLocationIndex] && (
                <LocationEditor
                  location={huntData.locations[selectedLocationIndex]}
                  onChange={(location) => handleLocationChange(selectedLocationIndex, location)}
                  availableLocationIds={huntData.locations.map(loc => loc.id)}
                  onFieldFocus={(field, element) => {
                    setFocusedField({
                      type: field as any,
                      locationIndex: selectedLocationIndex
                    })
                    if (element) focusedElementRef.current = element
                  }}
                  editorRefs={editorRefs}
                  locationIndex={selectedLocationIndex}
                />
              )}
            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:w-[400px] lg:shrink-0">
              <div
                className="space-y-4 transition-all duration-300 lg:fixed lg:right-8 lg:w-[400px] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
                style={{ top: '2rem' }}
              >
              {/* Formatting Toolbar */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Formatting Toolbar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <FormattingToolbar onFormat={handleFormat} />
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getFocusedFieldLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  {previewContent}
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Select a hunt from the dropdown above or create a new one to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
