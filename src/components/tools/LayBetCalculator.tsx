"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Target, AlertTriangle, Info, RefreshCw, Settings } from "lucide-react"

type BettingMode = "normal" | "free-bet-snr" | "free-bet-sr" | "partial-match"
type OddsFormat = "decimal" | "fractional" | "american"

interface LayBetInputs {
  backStake: string
  backOdds: string
  layOdds: string
  exchangeCommission: string
  freeBetAmount: string
  partialMatchPercent: string
}

interface LayBetResults {
  layStake: number
  layLiability: number
  backWinProfit: number
  layWinProfit: number
  totalReturn: number
  profit: number
  loss: number
  isValid: boolean
  errorMessage?: string
  profitMargin: number
  roi: number
}

export default function LayBetCalculator() {
  const [bettingMode, setBettingMode] = useState<BettingMode>("normal")
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>("decimal")
  const [inputs, setInputs] = useState<LayBetInputs>({
    backStake: "50",
    backOdds: "3.00",
    layOdds: "3.10",
    exchangeCommission: "2",
    freeBetAmount: "50",
    partialMatchPercent: "100"
  })
  const [results, setResults] = useState<LayBetResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateInput = useCallback((field: keyof LayBetInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }, [])

  const convertOddsToDecimal = useCallback((odds: string, format: OddsFormat): number => {
    const numOdds = parseFloat(odds)
    if (isNaN(numOdds)) return 0

    switch (format) {
      case "decimal":
        return numOdds
      case "fractional":
        // Assuming input like "2/1" or "5/2"
        const parts = odds.split("/")
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0])
          const denominator = parseFloat(parts[1])
          return (numerator / denominator) + 1
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

  const calculateLayBet = useCallback(() => {
    setIsCalculating(true)

    try {
      const backStake = parseFloat(inputs.backStake)
      const backOdds = convertOddsToDecimal(inputs.backOdds, oddsFormat)
      const layOdds = convertOddsToDecimal(inputs.layOdds, oddsFormat)
      const commission = parseFloat(inputs.exchangeCommission) / 100
      const freeBetAmount = parseFloat(inputs.freeBetAmount)
      const partialMatch = parseFloat(inputs.partialMatchPercent) / 100

      // Validation
      if (!backStake || backStake <= 0) {
        setResults({
          layStake: 0, layLiability: 0, backWinProfit: 0, layWinProfit: 0,
          totalReturn: 0, profit: 0, loss: 0, isValid: false,
          errorMessage: "Please enter a valid back stake amount",
          profitMargin: 0, roi: 0
        })
        return
      }

      if (!backOdds || backOdds < 1.01) {
        setResults({
          layStake: 0, layLiability: 0, backWinProfit: 0, layWinProfit: 0,
          totalReturn: 0, profit: 0, loss: 0, isValid: false,
          errorMessage: "Back odds must be greater than 1.01",
          profitMargin: 0, roi: 0
        })
        return
      }

      if (!layOdds || layOdds < 1.01) {
        setResults({
          layStake: 0, layLiability: 0, backWinProfit: 0, layWinProfit: 0,
          totalReturn: 0, profit: 0, loss: 0, isValid: false,
          errorMessage: "Lay odds must be greater than 1.01",
          profitMargin: 0, roi: 0
        })
        return
      }

      if (commission < 0 || commission > 0.1) {
        setResults({
          layStake: 0, layLiability: 0, backWinProfit: 0, layWinProfit: 0,
          totalReturn: 0, profit: 0, loss: 0, isValid: false,
          errorMessage: "Commission must be between 0% and 10%",
          profitMargin: 0, roi: 0
        })
        return
      }

      let effectiveBackStake = backStake
      let layStake: number
      let layLiability: number
      let backWinProfit: number
      let layWinProfit: number

      switch (bettingMode) {
        case "free-bet-snr": // Free bet - stake not returned
          effectiveBackStake = freeBetAmount || backStake
          // Optimize for profit when back wins (stake not returned)
          layStake = (effectiveBackStake * (backOdds - 1)) / (layOdds - (1 - commission))
          layLiability = layStake * (layOdds - 1)
          backWinProfit = effectiveBackStake * (backOdds - 1) - layLiability
          layWinProfit = layStake * (1 - commission)
          break

        case "free-bet-sr": // Free bet - stake returned
          effectiveBackStake = freeBetAmount || backStake
          // Calculate for when stake is returned
          layStake = (effectiveBackStake * backOdds) / (layOdds - (1 - commission))
          layLiability = layStake * (layOdds - 1)
          backWinProfit = effectiveBackStake * backOdds - layLiability
          layWinProfit = layStake * (1 - commission)
          break

        case "partial-match":
          const matchedStake = backStake * partialMatch
          layStake = (matchedStake * backOdds) / (layOdds - (1 - commission))
          layLiability = layStake * (layOdds - 1)
          backWinProfit = matchedStake * (backOdds - 1) - layLiability
          layWinProfit = layStake * (1 - commission) - (backStake - matchedStake)
          break

        default: // Normal betting mode
          // Minimize loss between outcomes
          layStake = (backStake * backOdds) / (layOdds - (1 - commission))
          layLiability = layStake * (layOdds - 1)
          backWinProfit = backStake * (backOdds - 1) - layLiability
          layWinProfit = layStake * (1 - commission) - backStake
          break
      }

      const totalReturn = Math.max(backWinProfit, layWinProfit)
      const profit = Math.max(backWinProfit, layWinProfit)
      const loss = Math.min(backWinProfit, layWinProfit)
      const profitMargin = Math.abs(backWinProfit - layWinProfit)
      const totalInvestment = bettingMode.includes("free-bet") ? layLiability : backStake + layLiability
      const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0

      setResults({
        layStake,
        layLiability,
        backWinProfit,
        layWinProfit,
        totalReturn,
        profit,
        loss,
        isValid: true,
        profitMargin,
        roi
      })

    } catch {
      setResults({
        layStake: 0, layLiability: 0, backWinProfit: 0, layWinProfit: 0,
        totalReturn: 0, profit: 0, loss: 0, isValid: false,
        errorMessage: "An error occurred during calculation. Please check your inputs.",
        profitMargin: 0, roi: 0
      })
    } finally {
      setTimeout(() => setIsCalculating(false), 300)
    }
  }, [inputs, bettingMode, oddsFormat, convertOddsToDecimal])

  const clearAll = useCallback(() => {
    setInputs({
      backStake: "50",
      backOdds: "3.00",
      layOdds: "3.10",
      exchangeCommission: "2",
      freeBetAmount: "50",
      partialMatchPercent: "100"
    })
    setResults(null)
    setBettingMode("normal")
  }, [])

  // Auto-calculate with debounce
  useEffect(() => {
    const timer = setTimeout(calculateLayBet, 300)
    return () => clearTimeout(timer)
  }, [calculateLayBet])

  const formatCurrency = useCallback((value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value), [])

  const formatPercentage = useCallback((value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, [])

  const getBettingModeDescription = useMemo(() => {
    switch (bettingMode) {
      case "normal":
        return "Standard matched betting using your own money"
      case "free-bet-snr":
        return "Free bet where stake is not returned on win"
      case "free-bet-sr":
        return "Free bet where stake is returned on win"
      case "partial-match":
        return "When only part of your bet gets matched"
      default:
        return ""
    }
  }, [bettingMode])

  const getOddsPlaceholder = useMemo(() => {
    switch (oddsFormat) {
      case "decimal": return "3.00"
      case "fractional": return "2/1"
      case "american": return "+200"
      default: return "3.00"
    }
  }, [oddsFormat])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Lay Bet Calculator
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Calculate optimal lay stakes for matched betting and guarantee profit or minimize loss
          </p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Betting Mode and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Betting Mode
              </label>
              <select
                value={bettingMode}
                onChange={(e) => setBettingMode(e.target.value as BettingMode)}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="normal">Normal Bet</option>
                <option value="free-bet-snr">Free Bet (SNR)</option>
                <option value="free-bet-sr">Free Bet (SR)</option>
                <option value="partial-match">Partial Match</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getBettingModeDescription}
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
                <option value="decimal">Decimal (3.00)</option>
                <option value="fractional">Fractional (2/1)</option>
                <option value="american">American (+200)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors min-h-[44px] w-full justify-center"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced
              </button>
            </div>
          </div>

          {/* Main Input Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Back Bet Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                Back Bet (Bookmaker)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Back Stake ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputs.backStake}
                      onChange={(e) => updateInput("backStake", e.target.value)}
                      className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Back Odds
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputs.backOdds}
                    onChange={(e) => updateInput("backOdds", e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder={getOddsPlaceholder}
                  />
                </div>

                {(bettingMode === "free-bet-snr" || bettingMode === "free-bet-sr") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Free Bet Amount ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={inputs.freeBetAmount}
                        onChange={(e) => updateInput("freeBetAmount", e.target.value)}
                        className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lay Bet Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                Lay Bet (Exchange)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lay Odds
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputs.layOdds}
                    onChange={(e) => updateInput("layOdds", e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder={getOddsPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exchange Commission (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputs.exchangeCommission}
                      onChange={(e) => updateInput("exchangeCommission", e.target.value)}
                      className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="2"
                    />
                  </div>
                </div>

                {bettingMode === "partial-match" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Matched Percentage (%)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={inputs.partialMatchPercent}
                        onChange={(e) => updateInput("partialMatchPercent", e.target.value)}
                        className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Advanced Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-calculate</span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Calculation Speed</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">300ms debounce</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Calculation Results
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
                  {/* Quick Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">Lay Stake</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {formatCurrency(results.layStake)}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Liability</span>
                      </div>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {formatCurrency(results.layLiability)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      results.profit >= 0 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    }`}>
                      <div className={`flex items-center gap-2 ${
                        results.profit >= 0 
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }`}>
                        {results.profit >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">Best Outcome</span>
                      </div>
                      <p className={`text-xl font-bold mt-1 ${
                        results.profit >= 0 
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}>
                        {formatCurrency(results.profit)}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Percent className="w-4 h-4" />
                        <span className="text-sm font-medium">ROI</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {formatPercentage(results.roi)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Outcome Analysis */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                      Outcome Analysis
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Back Bet Wins */}
                      <div className={`p-4 rounded-lg border ${
                        results.backWinProfit >= 0
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className={`font-medium ${
                            results.backWinProfit >= 0
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                          }`}>
                            If Back Bet Wins
                          </h5>
                          <TrendingUp className={`w-4 h-4 ${
                            results.backWinProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`} />
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Back winnings:</span>
                            <span className="font-medium">
                              {formatCurrency(parseFloat(inputs.backStake) * (convertOddsToDecimal(inputs.backOdds, oddsFormat) - 1))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Lay liability:</span>
                            <span className="font-medium">
                              -{formatCurrency(results.layLiability)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span className="font-medium">Net Result:</span>
                            <span className={`font-bold ${
                              results.backWinProfit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {formatCurrency(results.backWinProfit)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lay Bet Wins */}
                      <div className={`p-4 rounded-lg border ${
                        results.layWinProfit >= 0
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className={`font-medium ${
                            results.layWinProfit >= 0
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                          }`}>
                            If Lay Bet Wins
                          </h5>
                          <TrendingDown className={`w-4 h-4 ${
                            results.layWinProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`} />
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Lay winnings:</span>
                            <span className="font-medium">
                              {formatCurrency(results.layStake * (1 - parseFloat(inputs.exchangeCommission) / 100))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Back stake lost:</span>
                            <span className="font-medium">
                              -{formatCurrency(parseFloat(inputs.backStake))}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span className="font-medium">Net Result:</span>
                            <span className={`font-bold ${
                              results.layWinProfit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {formatCurrency(results.layWinProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profit Margin Analysis */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h5 className="font-medium text-blue-800 dark:text-blue-200">
                          Strategy Analysis
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Profit Margin:</span>
                          <p className="text-blue-800 dark:text-blue-200">
                            {formatCurrency(results.profitMargin)}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Strategy:</span>
                          <p className="text-blue-800 dark:text-blue-200">
                            {results.profit >= 0 ? "Profitable" : "Loss Minimization"}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Risk Level:</span>
                          <p className="text-blue-800 dark:text-blue-200">
                            {results.profitMargin < 5 ? "Low" : results.profitMargin < 20 ? "Medium" : "High"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Summary */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Next Steps
                    </h5>
                    <div className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                      <p>• Place back bet of {formatCurrency(parseFloat(inputs.backStake))} at {inputs.backOdds} odds with bookmaker</p>
                      <p>• Place lay bet of {formatCurrency(results.layStake)} at {inputs.layOdds} odds on exchange</p>
                      <p>• Ensure you have {formatCurrency(results.layLiability)} available as liability in exchange account</p>
                      {bettingMode.includes("free-bet") && (
                        <p>• This calculation uses your free bet - no cash back stake required</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Educational Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Betting Mode Guide
              </h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li><strong>Normal:</strong> Standard matched betting with your own money</li>
                <li><strong>Free Bet (SNR):</strong> Stake not returned - optimize for profit</li>
                <li><strong>Free Bet (SR):</strong> Stake returned - different calculation</li>
                <li><strong>Partial Match:</strong> When only part of bet gets matched</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Pro Tips
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Lower lay odds = lower lay stake required</li>
                <li>• Commission affects your profit - factor it in</li>
                <li>• Free bets (SNR) are more profitable than (SR)</li>
                <li>• Always check minimum bet limits on exchanges</li>
                <li>• Consider price movements before placing bets</li>
              </ul>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Important Disclaimers
                </h4>
                <div className="text-xs text-red-700 dark:text-red-300 mt-1 space-y-1">
                  <p>• This calculator is for educational purposes only</p>
                  <p>• Always verify calculations independently before placing bets</p>
                  <p>• Gambling laws vary by jurisdiction - ensure compliance</p>
                  <p>• Never bet more than you can afford to lose</p>
                  <p>• Consider time limits and wagering requirements for bonuses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}