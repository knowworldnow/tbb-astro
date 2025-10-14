"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Target, AlertTriangle, Plus, Trash2, Info, RefreshCw, Settings, CheckCircle, XCircle } from "lucide-react"

type CalculationMode = "total-stake" | "target-profit" | "custom-stake"
type OddsFormat = "decimal" | "fractional" | "american"

interface Outcome {
  id: string
  name: string
  odds: string
  bookmaker: string
  commission: string
  customStake?: string
}

interface ArbitrageResult {
  stake: number
  payout: number
  profit: number
  roi: number
}

interface ArbitrageResults {
  outcomes: (Outcome & ArbitrageResult)[]
  totalStake: number
  guaranteedProfit: number
  profitMargin: number
  roi: number
  isArbitrage: boolean
  isValid: boolean
  errorMessage?: string
  impliedProbability: number
}

export default function ArbitrageCalculator() {
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("total-stake")
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>("decimal")
  const [totalStake, setTotalStake] = useState<string>("100")
  const [targetProfit, setTargetProfit] = useState<string>("10")
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { id: "1", name: "Team A", odds: "2.10", bookmaker: "Bookmaker 1", commission: "0" },
    { id: "2", name: "Team B", odds: "2.00", bookmaker: "Bookmaker 2", commission: "0" }
  ])
  const [results, setResults] = useState<ArbitrageResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addOutcome = useCallback(() => {
    const newId = Math.max(...outcomes.map(o => parseInt(o.id)), 0) + 1
    setOutcomes(prev => [...prev, {
      id: newId.toString(),
      name: `Outcome ${newId}`,
      odds: "2.00",
      bookmaker: `Bookmaker ${newId}`,
      commission: "0"
    }])
  }, [outcomes])

  const removeOutcome = useCallback((id: string) => {
    if (outcomes.length > 2) {
      setOutcomes(prev => prev.filter(o => o.id !== id))
    }
  }, [outcomes])

  const updateOutcome = useCallback((id: string, field: keyof Outcome, value: string) => {
    setOutcomes(prev => prev.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    ))
  }, [])

  const convertOddsToDecimal = useCallback((odds: string, format: OddsFormat): number => {
    const numOdds = parseFloat(odds)
    if (isNaN(numOdds)) return 0

    switch (format) {
      case "decimal":
        return numOdds
      case "fractional":
        const parts = odds.split("/")
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0])
          const denominator = parseFloat(parts[1])
          if (denominator !== 0) {
            return (numerator / denominator) + 1
          }
        }
        return numOdds
      case "american":
        if (numOdds > 0) {
          return (numOdds / 100) + 1
        } else {
          return (100 / Math.abs(numOdds)) + 1
        }
      default:
        return numOdds
    }
  }, [])

  const calculateArbitrage = useCallback(() => {
    setIsCalculating(true)

    try {
      // Validate and convert odds
      const validOutcomes = outcomes.filter(o => {
        const decimalOdds = convertOddsToDecimal(o.odds, oddsFormat)
        const commission = parseFloat(o.commission)
        return decimalOdds > 1 && commission >= 0 && commission < 100
      })

      if (validOutcomes.length < 2) {
        setResults({
          outcomes: [],
          totalStake: 0,
          guaranteedProfit: 0,
          profitMargin: 0,
          roi: 0,
          isArbitrage: false,
          isValid: false,
          errorMessage: "At least 2 valid outcomes with odds > 1.0 are required",
          impliedProbability: 0
        })
        return
      }

      // Convert odds and calculate implied probabilities
      const outcomeData = validOutcomes.map(o => {
        const decimalOdds = convertOddsToDecimal(o.odds, oddsFormat)
        const commission = parseFloat(o.commission) / 100
        const adjustedOdds = decimalOdds * (1 - commission)
        const impliedProb = 1 / decimalOdds
        return { ...o, decimalOdds, commission, adjustedOdds, impliedProb }
      })

      const totalImpliedProb = outcomeData.reduce((sum, o) => sum + o.impliedProb, 0)
      const isArbitrage = totalImpliedProb < 1
      const profitMargin = isArbitrage ? ((1 - totalImpliedProb) / totalImpliedProb) * 100 : 0

      if (!isArbitrage) {
        setResults({
          outcomes: [],
          totalStake: 0,
          guaranteedProfit: 0,
          profitMargin: 0,
          roi: 0,
          isArbitrage: false,
          isValid: true,
          errorMessage: "No arbitrage opportunity exists with these odds",
          impliedProbability: totalImpliedProb * 100
        })
        return
      }

      let calculatedStakes: number[]
      let calculatedTotalStake: number
      let calculatedProfit: number

      switch (calculationMode) {
        case "total-stake":
          const baseStake = parseFloat(totalStake)
          if (!baseStake || baseStake <= 0) {
            throw new Error("Please enter a valid total stake amount")
          }
          calculatedTotalStake = baseStake
          calculatedStakes = outcomeData.map(o => 
            (o.impliedProb / totalImpliedProb) * calculatedTotalStake
          )
          calculatedProfit = calculatedTotalStake * (1 / totalImpliedProb - 1)
          break

        case "target-profit":
          const targetProfitAmount = parseFloat(targetProfit)
          if (!targetProfitAmount || targetProfitAmount <= 0) {
            throw new Error("Please enter a valid target profit amount")
          }
          calculatedProfit = targetProfitAmount
          calculatedTotalStake = calculatedProfit / (1 / totalImpliedProb - 1)
          calculatedStakes = outcomeData.map(o => 
            (o.impliedProb / totalImpliedProb) * calculatedTotalStake
          )
          break

        case "custom-stake":
          // Find the first outcome with a custom stake
          const customOutcome = outcomeData.find(o => o.customStake && parseFloat(o.customStake) > 0)
          if (!customOutcome) {
            throw new Error("Please enter a custom stake for at least one outcome")
          }
          const customStakeAmount = parseFloat(customOutcome.customStake!)
          const customOutcomeIndex = outcomeData.indexOf(customOutcome)
          
          // Calculate total stake based on custom stake
          calculatedTotalStake = customStakeAmount / (customOutcome.impliedProb / totalImpliedProb)
          calculatedStakes = outcomeData.map(o => 
            (o.impliedProb / totalImpliedProb) * calculatedTotalStake
          )
          calculatedProfit = calculatedTotalStake * (1 / totalImpliedProb - 1)
          break

        default:
          throw new Error("Invalid calculation mode")
      }

      const roi = calculatedTotalStake > 0 ? (calculatedProfit / calculatedTotalStake) * 100 : 0

      const resultsWithCalculations = outcomeData.map((outcome, index) => {
        const stake = calculatedStakes[index]
        const payout = stake * outcome.adjustedOdds
        const profit = payout - calculatedTotalStake
        const individualRoi = stake > 0 ? ((payout - stake) / stake) * 100 : 0

        return {
          id: outcome.id,
          name: outcome.name,
          odds: outcome.odds,
          bookmaker: outcome.bookmaker,
          commission: (outcome.commission * 100).toString(),
          customStake: outcome.customStake,
          stake,
          payout,
          profit,
          roi: individualRoi
        }
      })

      setResults({
        outcomes: resultsWithCalculations,
        totalStake: calculatedTotalStake,
        guaranteedProfit: calculatedProfit,
        profitMargin,
        roi,
        isArbitrage: true,
        isValid: true,
        impliedProbability: totalImpliedProb * 100
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during calculation"
      setResults({
        outcomes: [],
        totalStake: 0,
        guaranteedProfit: 0,
        profitMargin: 0,
        roi: 0,
        isArbitrage: false,
        isValid: false,
        errorMessage,
        impliedProbability: 0
      })
    } finally {
      setTimeout(() => setIsCalculating(false), 300)
    }
  }, [outcomes, calculationMode, totalStake, targetProfit, oddsFormat, convertOddsToDecimal])

  const clearAll = useCallback(() => {
    setTotalStake("100")
    setTargetProfit("10")
    setOutcomes([
      { id: "1", name: "Team A", odds: "2.10", bookmaker: "Bookmaker 1", commission: "0" },
      { id: "2", name: "Team B", odds: "2.00", bookmaker: "Bookmaker 2", commission: "0" }
    ])
    setResults(null)
    setCalculationMode("total-stake")
  }, [])

  // Auto-calculate with debounce
  useEffect(() => {
    const timer = setTimeout(calculateArbitrage, 300)
    return () => clearTimeout(timer)
  }, [calculateArbitrage])

  const formatCurrency = useCallback((value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value), [])

  const formatPercentage = useCallback((value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, [])

  const getCalculationModeDescription = useMemo(() => {
    switch (calculationMode) {
      case "total-stake":
        return "Set total stake and distribute across outcomes"
      case "target-profit":
        return "Set desired profit and calculate required stakes"
      case "custom-stake":
        return "Set stake for one outcome, calculate others"
      default:
        return ""
    }
  }, [calculationMode])

  const getOddsPlaceholder = useMemo(() => {
    switch (oddsFormat) {
      case "decimal": return "2.00"
      case "fractional": return "1/1"
      case "american": return "+100"
      default: return "2.00"
    }
  }, [oddsFormat])

  const presetEvents = [
    { name: "Tennis Match", outcomes: ["Player A", "Player B"] },
    { name: "Soccer Match", outcomes: ["Home", "Draw", "Away"] },
    { name: "Basketball Game", outcomes: ["Team A", "Team B"] },
    { name: "Custom", outcomes: [] }
  ]

  const loadPreset = useCallback((preset: typeof presetEvents[0]) => {
    if (preset.outcomes.length > 0) {
      setOutcomes(preset.outcomes.map((name, index) => ({
        id: (index + 1).toString(),
        name,
        odds: "2.00",
        bookmaker: `Bookmaker ${index + 1}`,
        commission: "0"
      })))
    }
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Arbitrage Calculator
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Calculate optimal stakes across multiple bookmakers to guarantee profit regardless of outcome
          </p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Mode Selection and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Calculation Mode
              </label>
              <select
                value={calculationMode}
                onChange={(e) => setCalculationMode(e.target.value as CalculationMode)}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="total-stake">Total Stake</option>
                <option value="target-profit">Target Profit</option>
                <option value="custom-stake">Custom Stake</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getCalculationModeDescription}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Odds Format
              </label>
              <select
                value={oddsFormat}
                onChange={(e) => setOddsFormat(e.target.value as OddsFormat)}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="decimal">Decimal (2.00)</option>
                <option value="fractional">Fractional (1/1)</option>
                <option value="american">American (+100)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Preset
              </label>
              <select
                onChange={(e) => {
                  const preset = presetEvents.find(p => p.name === e.target.value)
                  if (preset) loadPreset(preset)
                }}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">Select preset...</option>
                {presetEvents.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors min-h-[44px] w-full justify-center"
              >
                <Settings className="w-4 h-4" />
                Advanced
              </button>
            </div>
          </div>

          {/* Stake/Profit Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculationMode === "total-stake" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Stake ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={totalStake}
                    onChange={(e) => setTotalStake(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            {calculationMode === "target-profit" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Profit ($)
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Outcomes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Outcomes
              </h3>
              <button
                onClick={addOutcome}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add Outcome
              </button>
            </div>

            <div className="space-y-3">
              {outcomes.map((outcome) => (
                <div key={outcome.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Outcome Name
                    </label>
                    <input
                      type="text"
                      value={outcome.name}
                      onChange={(e) => updateOutcome(outcome.id, "name", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="Team A"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Odds
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={outcome.odds}
                      onChange={(e) => updateOutcome(outcome.id, "odds", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder={getOddsPlaceholder}
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Bookmaker
                    </label>
                    <input
                      type="text"
                      value={outcome.bookmaker}
                      onChange={(e) => updateOutcome(outcome.id, "bookmaker", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="Bookmaker"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Commission (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={outcome.commission}
                      onChange={(e) => updateOutcome(outcome.id, "commission", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  {calculationMode === "custom-stake" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Custom Stake ($)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={outcome.customStake || ""}
                        onChange={(e) => updateOutcome(outcome.id, "customStake", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  )}
                  
                  <div className={`${calculationMode === "custom-stake" ? "sm:col-span-2" : "sm:col-span-2"} flex items-end`}>
                    <button
                      onClick={() => removeOutcome(outcome.id)}
                      disabled={outcomes.length <= 2}
                      className="w-full h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Results
                </h3>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors min-h-[44px]"
                >
                  <RefreshCw className="w-4 h-4" />
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
                  {/* Arbitrage Status */}
                  <div className={`p-4 border rounded-lg ${
                    results.isArbitrage 
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      {results.isArbitrage ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <h4 className={`text-sm font-medium ${
                          results.isArbitrage 
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                        }`}>
                          {results.isArbitrage ? "Arbitrage Opportunity Found!" : "No Arbitrage Opportunity"}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          results.isArbitrage 
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        }`}>
                          Implied probability: {results.impliedProbability.toFixed(2)}%
                          {results.isArbitrage && ` • Profit margin: ${results.profitMargin.toFixed(2)}%`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {results.isArbitrage && (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm font-medium">Total Stake</span>
                          </div>
                          <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                            {formatCurrency(results.totalStake)}
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Guaranteed Profit</span>
                          </div>
                          <p className="text-xl font-bold text-green-900 dark:text-green-100 mt-1">
                            {formatCurrency(results.guaranteedProfit)}
                          </p>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                            <Percent className="w-4 h-4" />
                            <span className="text-sm font-medium">Profit Margin</span>
                          </div>
                          <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                            {formatPercentage(results.profitMargin)}
                          </p>
                        </div>

                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">ROI</span>
                          </div>
                          <p className="text-xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                            {formatPercentage(results.roi)}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Stakes Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                          Stake Distribution
                        </h4>
                        {results.outcomes.map((outcome) => (
                          <div key={outcome.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                              <div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                  Outcome
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {outcome.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                  {outcome.bookmaker}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                  Stake Required
                                </span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(outcome.stake)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                  If Wins - Payout
                                </span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(outcome.payout)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                  Net Profit
                                </span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(outcome.profit)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                  Individual ROI
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatPercentage(outcome.roi)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Implementation Guide */}
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Implementation Steps
                        </h5>
                        <div className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                          {results.outcomes.map((outcome, index) => (
                            <p key={outcome.id}>
                              {index + 1}. Place {formatCurrency(outcome.stake)} on "{outcome.name}" at {outcome.odds} odds with {outcome.bookmaker}
                            </p>
                          ))}
                          <p className="font-medium mt-2">
                            Total investment: {formatCurrency(results.totalStake)} • Guaranteed profit: {formatCurrency(results.guaranteedProfit)}
                          </p>
                        </div>
                      </div>

                      {/* Profit Analysis */}
                      {showAdvanced && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                            Advanced Analysis
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Market Efficiency:</span>
                              <p className="text-blue-800 dark:text-blue-200">
                                {results.profitMargin > 5 ? "Low" : results.profitMargin > 2 ? "Medium" : "High"}
                              </p>
                            </div>
                            <div>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Risk Level:</span>
                              <p className="text-blue-800 dark:text-blue-200">
                                {results.profitMargin > 1 ? "Low Risk" : "Monitor Closely"}
                              </p>
                            </div>
                            <div>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Speed Required:</span>
                              <p className="text-blue-800 dark:text-blue-200">
                                {results.profitMargin > 3 ? "Normal" : "Fast Execution"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Educational Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Arbitrage Requirements
              </h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• Combined implied probability must be less than 100%</li>
                <li>• Minimum 2 outcomes with different bookmakers</li>
                <li>• Account for commission and withdrawal fees</li>
                <li>• Verify bet limits before placing stakes</li>
                <li>• Execute quickly as odds change frequently</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Pro Tips
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Higher profit margins indicate more stable opportunities</li>
                <li>• Use multiple accounts to access better odds</li>
                <li>• Consider stake limits and withdrawal restrictions</li>
                <li>• Monitor for account restrictions with heavy arbing</li>
                <li>• Factor in time zones for international bookmakers</li>
              </ul>
            </div>
          </div>

          {/* Risk Disclaimer */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Important Disclaimers
                </h4>
                <div className="text-xs text-red-700 dark:text-red-300 mt-1 space-y-1">
                  <p>• Arbitrage betting may violate bookmaker terms of service</p>
                  <p>• Always verify odds and stake limits before placing bets</p>
                  <p>• Account restrictions and closures are common with arbitrage betting</p>
                  <p>• This calculator is for educational purposes only</p>
                  <p>• Gambling laws vary by jurisdiction - ensure compliance</p>
                  <p>• Never bet more than you can afford to lose</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              Quick Reference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <strong>Decimal Odds:</strong> 2.00 = 50% probability
              </div>
              <div>
                <strong>Fractional Odds:</strong> 1/1 = 50% probability
              </div>
              <div>
                <strong>American Odds:</strong> +100 = 50% probability
              </div>
              <div>
                <strong>Profit Formula:</strong> (1/total_implied_prob - 1) × 100%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}