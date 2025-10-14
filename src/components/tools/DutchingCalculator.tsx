"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, Plus, Trash2, DollarSign, Target, TrendingUp, AlertTriangle } from "lucide-react"

interface Selection {
  id: string
  name: string
  odds: string
  commission: string
}

interface CalculationResult {
  stake: number
  profit: number
  totalReturn: number
}

interface DutchingResults {
  selections: (Selection & CalculationResult)[]
  totalStake: number
  guaranteedProfit: number
  roi: number
  isValid: boolean
  errorMessage?: string
}

export default function DutchingCalculator() {
  const [totalStake, setTotalStake] = useState<string>("100")
  const [targetProfit, setTargetProfit] = useState<string>("")
  const [calculationMode, setCalculationMode] = useState<"stake" | "profit">("stake")
  const [selections, setSelections] = useState<Selection[]>([
    { id: "1", name: "Selection 1", odds: "2.0", commission: "0" },
    { id: "2", name: "Selection 2", odds: "3.0", commission: "0" }
  ])
  const [results, setResults] = useState<DutchingResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const addSelection = useCallback(() => {
    const newId = Math.max(...selections.map(s => parseInt(s.id)), 0) + 1
    setSelections(prev => [...prev, {
      id: newId.toString(),
      name: `Selection ${newId}`,
      odds: "2.0",
      commission: "0"
    }])
  }, [selections])

  const removeSelection = useCallback((id: string) => {
    if (selections.length > 2) {
      setSelections(prev => prev.filter(s => s.id !== id))
    }
  }, [selections])

  const updateSelection = useCallback((id: string, field: keyof Selection, value: string) => {
    setSelections(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }, [])

  const calculateDutching = useCallback(() => {
    setIsCalculating(true)
    
    try {
      // Validate inputs
      const validSelections = selections.filter(s => {
        const odds = parseFloat(s.odds)
        const commission = parseFloat(s.commission)
        return odds > 1 && commission >= 0 && commission < 100
      })

      if (validSelections.length < 2) {
        setResults({
          selections: [],
          totalStake: 0,
          guaranteedProfit: 0,
          roi: 0,
          isValid: false,
          errorMessage: "At least 2 valid selections with odds > 1.0 are required"
        })
        return
      }

      const baseValue = calculationMode === "stake" 
        ? parseFloat(totalStake) 
        : parseFloat(targetProfit)

      if (!baseValue || baseValue <= 0) {
        setResults({
          selections: [],
          totalStake: 0,
          guaranteedProfit: 0,
          roi: 0,
          isValid: false,
          errorMessage: `Please enter a valid ${calculationMode === "stake" ? "total stake" : "target profit"}`
        })
        return
      }

      // Calculate implied probabilities and commission adjustments
      const selectionData = validSelections.map(s => {
        const odds = parseFloat(s.odds)
        const commission = parseFloat(s.commission) / 100
        const adjustedOdds = odds - (odds - 1) * commission
        const impliedProb = 1 / adjustedOdds
        return { ...s, odds, commission, adjustedOdds, impliedProb }
      })

      const totalImpliedProb = selectionData.reduce((sum, s) => sum + s.impliedProb, 0)

      // Check if dutching is profitable (total implied probability should be < 1)
      if (totalImpliedProb >= 1) {
        setResults({
          selections: [],
          totalStake: 0,
          guaranteedProfit: 0,
          roi: 0,
          isValid: false,
          errorMessage: "These odds do not provide a profitable dutching opportunity. The combined implied probability is >= 100%"
        })
        return
      }

      let calculatedStakes: number[]
      let calculatedTotalStake: number
      let calculatedProfit: number

      if (calculationMode === "stake") {
        // Calculate stakes based on total stake
        calculatedTotalStake = baseValue
        calculatedStakes = selectionData.map(s => 
          (s.impliedProb / totalImpliedProb) * calculatedTotalStake
        )
        calculatedProfit = calculatedTotalStake * (1 / totalImpliedProb - 1)
      } else {
        // Calculate stakes based on target profit
        calculatedProfit = baseValue
        calculatedTotalStake = calculatedProfit / (1 / totalImpliedProb - 1)
        calculatedStakes = selectionData.map(s => 
          (s.impliedProb / totalImpliedProb) * calculatedTotalStake
        )
      }

      const roi = (calculatedProfit / calculatedTotalStake) * 100

      const resultsWithCalculations = selectionData.map((s, index) => ({
        id: s.id,
        name: s.name,
        odds: s.odds.toString(),
        commission: (s.commission * 100).toString(),
        stake: calculatedStakes[index],
        profit: calculatedProfit,
        totalReturn: calculatedStakes[index] + calculatedProfit
      }))

      setResults({
        selections: resultsWithCalculations,
        totalStake: calculatedTotalStake,
        guaranteedProfit: calculatedProfit,
        roi,
        isValid: true
      })

    } catch {
      setResults({
        selections: [],
        totalStake: 0,
        guaranteedProfit: 0,
        roi: 0,
        isValid: false,
        errorMessage: "An error occurred during calculation. Please check your inputs."
      })
    } finally {
      setTimeout(() => setIsCalculating(false), 300)
    }
  }, [selections, totalStake, targetProfit, calculationMode])

  const clearAll = useCallback(() => {
    setTotalStake("100")
    setTargetProfit("")
    setSelections([
      { id: "1", name: "Selection 1", odds: "2.0", commission: "0" },
      { id: "2", name: "Selection 2", odds: "3.0", commission: "0" }
    ])
    setResults(null)
  }, [])

  // Auto-calculate with debounce
  useEffect(() => {
    const timer = setTimeout(calculateDutching, 300)
    return () => clearTimeout(timer)
  }, [calculateDutching])

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Dutching Calculator
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Distribute your stake across multiple selections to guarantee equal profit regardless of which wins
          </p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Calculation Mode & Base Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Calculation Mode
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setCalculationMode("stake")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    calculationMode === "stake"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  Total Stake
                </button>
                <button
                  onClick={() => setCalculationMode("profit")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    calculationMode === "profit"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  Target Profit
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {calculationMode === "stake" ? "Total Stake ($)" : "Target Profit ($)"}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={calculationMode === "stake" ? totalStake : targetProfit}
                  onChange={(e) => calculationMode === "stake" 
                    ? setTotalStake(e.target.value) 
                    : setTargetProfit(e.target.value)
                  }
                  className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </div>

          {/* Selections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Selections
              </h3>
              <button
                onClick={addSelection}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add Selection
              </button>
            </div>

            <div className="space-y-3">
              {selections.map((selection) => (
                <div key={selection.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Selection Name
                    </label>
                    <input
                      type="text"
                      value={selection.name}
                      onChange={(e) => updateSelection(selection.id, "name", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="Selection name"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Odds (Decimal)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selection.odds}
                      onChange={(e) => updateSelection(selection.id, "odds", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="2.0"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Commission (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selection.commission}
                      onChange={(e) => updateSelection(selection.id, "commission", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      onClick={() => removeSelection(selection.id)}
                      disabled={selections.length <= 2}
                      className="w-full h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Results
                </h3>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors min-h-[44px]"
                >
                  Clear All
                </button>
              </div>

              {isCalculating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Calculating...</span>
                </div>
              ) : !results.isValid ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Calculation Error
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {results.errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Stake</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {formatCurrency(results.totalStake)}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Guaranteed Profit</span>
                      </div>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {formatCurrency(results.guaranteedProfit)}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">ROI</span>
                      </div>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {formatPercentage(results.roi)}
                      </p>
                    </div>
                  </div>

                  {/* Individual Stakes */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                      Individual Stakes
                    </h4>
                    {results.selections.map((selection) => (
                      <div key={selection.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                              Selection
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {selection.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                              Stake Required
                            </span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(selection.stake)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                              If Wins - Profit
                            </span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(selection.profit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                              Total Return
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(selection.totalReturn)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              How Dutching Works
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Enter odds for each selection you want to back</li>
              <li>• Choose whether to work from total stake or target profit</li>
              <li>• The calculator distributes stakes to guarantee equal profit</li>
              <li>• Add commission percentages for betting exchanges</li>
              <li>• Only profitable when combined implied probability &lt; 100%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}