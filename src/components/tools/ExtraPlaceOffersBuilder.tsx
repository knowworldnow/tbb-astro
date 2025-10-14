"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calendar, Clock, MapPin, Users, Target, Download, Copy, Plus, Trash2, Upload, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface Race {
  id: string
  time: string
  course: string
  runners: number
  places: number
  placeFraction: string
  bookmakers: string[]
}

interface Bookmaker {
  name: string
  threshold: number
  label: string
}

const bookmakers: Bookmaker[] = [
  { name: "bet365", threshold: 0, label: "bet365" },
  { name: "skybet", threshold: 8, label: "Sky Bet (8+)" },
  { name: "paddypower", threshold: 11, label: "Paddy Power (11+)" },
  { name: "williamhill", threshold: 12, label: "William Hill (12+)" },
  { name: "ladbrokes", threshold: 16, label: "Ladbrokes (16+)" }
]

const placesOptions = [3, 4, 5, 6]
const placeFractionOptions = ["1/4", "1/5"]

export default function ExtraPlaceOffersTool() {
  const [postDate, setPostDate] = useState(() => new Date().toISOString().split('T')[0])
  const [introText, setIntroText] = useState("Here are today's extra place offers from various bookmakers:")
  const [races, setRaces] = useState<Race[]>([])
  const [newRace, setNewRace] = useState({
    time: "",
    course: "",
    runners: "",
    places: 4,
    placeFraction: "1/4",
    bookmakers: [] as string[]
  })
  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Validation
  const validateRace = useCallback((race: Partial<Race>) => {
    const errors: Record<string, string> = {}
    
    if (!race.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(race.time)) {
      errors.time = "Time must be in HH:MM format"
    }
    
    if (!race.course?.trim()) {
      errors.course = "Course name is required"
    }
    
    if (!race.runners || race.runners < 1) {
      errors.runners = "Runners must be a positive number"
    }
    
    if (!race.places || race.places < 3 || race.places > 6) {
      errors.places = "Places must be between 3 and 6"
    }
    
    return errors
  }, [])

  // Auto-validate new race
  useEffect(() => {
    const raceErrors = validateRace({
      time: newRace.time,
      course: newRace.course,
      runners: parseInt(newRace.runners) || 0,
      places: newRace.places
    })
    setErrors(raceErrors)
  }, [newRace, validateRace])

  // Sort races by time, then course
  const sortedRaces = useMemo(() => {
    return [...races].sort((a, b) => {
      if (a.time !== b.time) return a.time.localeCompare(b.time)
      return a.course.localeCompare(b.course)
    })
  }, [races])

  // Add race
  const addRace = useCallback(() => {
    const raceData = {
      time: newRace.time,
      course: newRace.course,
      runners: parseInt(newRace.runners) || 0,
      places: newRace.places
    }
    
    const raceErrors = validateRace(raceData)
    if (Object.keys(raceErrors).length > 0) return

    const race: Race = {
      id: Date.now().toString(),
      time: newRace.time,
      course: newRace.course,
      runners: parseInt(newRace.runners),
      places: newRace.places,
      placeFraction: newRace.placeFraction,
      bookmakers: [...newRace.bookmakers]
    }

    setRaces(prev => [...prev, race])
    setNewRace({
      time: "",
      course: "",
      runners: "",
      places: 4,
      placeFraction: "1/4",
      bookmakers: []
    })
  }, [newRace, validateRace])

  // Remove race
  const removeRace = useCallback((id: string) => {
    setRaces(prev => prev.filter(race => race.id !== id))
  }, [])

  // Toggle bookmaker for new race
  const toggleNewRaceBookmaker = useCallback((bookmakerName: string) => {
    setNewRace(prev => ({
      ...prev,
      bookmakers: prev.bookmakers.includes(bookmakerName)
        ? prev.bookmakers.filter(b => b !== bookmakerName)
        : [...prev.bookmakers, bookmakerName]
    }))
  }, [])

  // Toggle bookmaker for existing race
  const toggleRaceBookmaker = useCallback((raceId: string, bookmakerName: string) => {
    setRaces(prev => prev.map(race => 
      race.id === raceId
        ? {
            ...race,
            bookmakers: race.bookmakers.includes(bookmakerName)
              ? race.bookmakers.filter(b => b !== bookmakerName)
              : [...race.bookmakers, bookmakerName]
          }
        : race
    ))
  }, [])

  // Import races
  const importRaces = useCallback(() => {
    try {
      let importedRaces: any[] = []
      
      if (importText.trim().startsWith('[')) {
        // JSON format
        importedRaces = JSON.parse(importText)
      } else {
        // CSV format
        const lines = importText.trim().split('\n')
        const header = lines[0].toLowerCase()
        
        if (!header.includes('time') || !header.includes('course') || !header.includes('runners')) {
          throw new Error('CSV must have time, course, and runners columns')
        }
        
        importedRaces = lines.slice(1).map(line => {
          const [time, course, runners] = line.split(',').map(s => s.trim())
          return { time, course, runners: parseInt(runners) || 0 }
        })
      }

      const newRaces: Race[] = importedRaces
        .filter(race => race.time && race.course && race.runners > 0)
        .map(race => ({
          id: Date.now().toString() + Math.random(),
          time: race.time,
          course: race.course,
          runners: parseInt(race.runners) || 0,
          places: race.places || 4,
          placeFraction: race.placeFraction || "1/4",
          bookmakers: []
        }))

      setRaces(prev => [...prev, ...newRaces])
      setImportText("")
      setShowImport(false)
    } catch (error) {
      alert('Import failed. Please check your data format.')
    }
  }, [importText])

  // Clear all races
  const clearAllRaces = useCallback(() => {
    if (confirm('Are you sure you want to clear all races?')) {
      setRaces([])
    }
  }, [])

  // Get bookmaker status for a race
  const getBookmakerStatus = useCallback((race: Race, bookmaker: Bookmaker) => {
    const isSelected = race.bookmakers.includes(bookmaker.name)
    const meetsThreshold = race.runners >= bookmaker.threshold
    
    if (!isSelected) return 'unselected'
    if (meetsThreshold) return 'meets'
    return 'fails'
  }, [])

  // Generate markdown
  const generateMarkdown = useCallback(async () => {
    setIsGenerating(true)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const formattedDate = new Date(postDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    let markdown = `# Extra Place Offers - ${formattedDate}\n\n`
    markdown += `${introText}\n\n`

    if (sortedRaces.length === 0) {
      markdown += `No races available for today.\n\n`
    } else {
      sortedRaces.forEach(race => {
        const bookmakerLabels = race.bookmakers
          .map(bmName => bookmakers.find(bm => bm.name === bmName)?.label)
          .filter(Boolean)
          .join(', ')

        markdown += `**${race.time} ${race.course}** (${race.runners} runners, ${race.places} places ${race.placeFraction})`
        if (bookmakerLabels) {
          markdown += ` - ${bookmakerLabels}`
        }
        markdown += `\n\n`
      })
    }

    markdown += `---\n\n`
    markdown += `**Useful Tools:**\n`
    markdown += `- [Each-Way Calculator](/calculators/each-way)\n`
    markdown += `- [Lay Bet Calculator](/calculators/lay-bet)\n`
    markdown += `- [Free Bet Calculator](/calculators/free-bet)\n`
    markdown += `- [Dutching Calculator](/calculators/dutching)\n\n`
    markdown += `*Updated: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}*`

    setIsGenerating(false)
    return markdown
  }, [postDate, introText, sortedRaces])

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const markdown = await generateMarkdown()
    try {
      await navigator.clipboard.writeText(markdown)
      alert('Copied to clipboard!')
    } catch (error) {
      alert('Failed to copy to clipboard')
    }
  }, [generateMarkdown])

  // Download markdown
  const downloadMarkdown = useCallback(async () => {
    const markdown = await generateMarkdown()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extra-places-${postDate}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [generateMarkdown, postDate])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Extra Place Offers Tool
            </h1>
          </div>

          {/* Date and Intro Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Post Date
              </label>
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Intro Text
              </label>
              <input
                type="text"
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="Introduction for the post..."
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Import Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Races
              </h2>
              <button
                onClick={() => setShowImport(!showImport)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                {showImport ? 'Hide' : 'Show'} Import
              </button>
            </div>
            
            {showImport && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CSV (time,course,runners) or JSON format
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="time,course,runners&#10;14:30,Ascot,12&#10;15:00,Newmarket,16&#10;&#10;OR&#10;&#10;[{&quot;time&quot;:&quot;14:30&quot;,&quot;course&quot;:&quot;Ascot&quot;,&quot;runners&quot;:12}]"
                    rows={4}
                    className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={importRaces}
                    disabled={!importText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors min-h-[44px] disabled:cursor-not-allowed"
                  >
                    Import Races
                  </button>
                  <button
                    onClick={() => setImportText("")}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors min-h-[44px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add New Race */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Race
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={newRace.time}
                  onChange={(e) => setNewRace(prev => ({ ...prev, time: e.target.value }))}
                  className={`w-full h-12 px-4 text-base border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                    errors.time ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.time}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Course
                </label>
                <input
                  type="text"
                  value={newRace.course}
                  onChange={(e) => setNewRace(prev => ({ ...prev, course: e.target.value }))}
                  placeholder="e.g., Ascot"
                  className={`w-full h-12 px-4 text-base border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                    errors.course ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.course}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Runners
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newRace.runners}
                  onChange={(e) => setNewRace(prev => ({ ...prev, runners: e.target.value }))}
                  placeholder="12"
                  min="1"
                  className={`w-full h-12 px-4 text-base border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                    errors.runners ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.runners && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.runners}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Places
                  </label>
                  <select
                    value={newRace.places}
                    onChange={(e) => setNewRace(prev => ({ ...prev, places: parseInt(e.target.value) }))}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    {placesOptions.map(places => (
                      <option key={places} value={places}>{places}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fraction
                  </label>
                  <select
                    value={newRace.placeFraction}
                    onChange={(e) => setNewRace(prev => ({ ...prev, placeFraction: e.target.value }))}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    {placeFractionOptions.map(fraction => (
                      <option key={fraction} value={fraction}>{fraction}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bookmaker Selection for New Race */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bookmakers
              </label>
              <div className="flex flex-wrap gap-2">
                {bookmakers.map(bookmaker => {
                  const isSelected = newRace.bookmakers.includes(bookmaker.name)
                  const runnersCount = parseInt(newRace.runners) || 0
                  const meetsThreshold = runnersCount >= bookmaker.threshold
                  const canSelect = runnersCount > 0 && meetsThreshold

                  return (
                    <button
                      key={bookmaker.name}
                      onClick={() => canSelect && toggleNewRaceBookmaker(bookmaker.name)}
                      disabled={!canSelect}
                      className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] transition-all ${
                        isSelected && canSelect
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500'
                          : canSelect
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {bookmaker.label}
                      {runnersCount > 0 && !meetsThreshold && (
                        <span className="ml-1 text-xs">
                          (Need {bookmaker.threshold}+)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={addRace}
              disabled={Object.keys(errors).length > 0 || !newRace.time || !newRace.course || !newRace.runners}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors min-h-[44px] disabled:cursor-not-allowed font-medium"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Race
            </button>
          </div>

          {/* Races List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Races ({sortedRaces.length})
              </h2>
              {sortedRaces.length > 0 && (
                <button
                  onClick={clearAllRaces}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors min-h-[44px] text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4">
              {sortedRaces.map(race => (
                <div key={race.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {race.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {race.course}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {race.runners} runners
                        </span>
                        <span>{race.places} places {race.placeFraction}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRace(race.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {bookmakers.map(bookmaker => {
                      const status = getBookmakerStatus(race, bookmaker)
                      
                      return (
                        <button
                          key={bookmaker.name}
                          onClick={() => toggleRaceBookmaker(race.id, bookmaker.name)}
                          className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] transition-all flex items-center gap-1 ${
                            status === 'meets'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500'
                              : status === 'fails'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-500'
                              : race.runners >= bookmaker.threshold
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                          }`}
                          disabled={race.runners < bookmaker.threshold}
                        >
                          {status === 'meets' && <CheckCircle2 className="w-4 h-4" />}
                          {status === 'fails' && <XCircle className="w-4 h-4" />}
                          {bookmaker.label}
                          {race.runners < bookmaker.threshold && (
                            <span className="ml-1 text-xs">
                              (Need {bookmaker.threshold}+)
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {sortedRaces.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No races added yet</p>
                  <p className="text-sm">Add races manually or import from CSV/JSON</p>
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          {sortedRaces.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generate Output
              </h2>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyToClipboard}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors min-h-[44px] disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                
                <button
                  onClick={downloadMarkdown}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors min-h-[44px] disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download .md
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  <strong>Output includes:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Formatted date header</li>
                  <li>Custom intro text</li>
                  <li>Race details with selected bookmakers</li>
                  <li>Links to betting calculators</li>
                  <li>Timestamp for freshness</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}