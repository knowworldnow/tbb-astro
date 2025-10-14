"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, TrendingUp, Target, AlertCircle, CheckCircle, XCircle, BarChart3, RefreshCw } from "lucide-react"

interface Calculation {
  backStake: number
  layStake: number
  profit2Up: number
  profitLayWins: number
  profitBothWin: number
  profitBothLose: number
  qualifyingLoss: number
  roi: number
  isRiskFree: boolean
}

interface ValidationErrors {
  backOdds?: string
  layOdds?: string
  backStake?: string
  commission?: string
}

export default function TwoUpCalculator() {
  const [backOdds, setBackOdds] = useState<string>("3.00")
  const [layOdds, setLayOdds] = useState<string>("3.10")
  const [backStake, setBackStake] = useState<string>("100")
  const [commission, setCommission] = useState<string>("2")
  const [hedgeAfter2Up, setHedgeAfter2Up] = useState<boolean>(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [calculation, setCalculation] = useState<Calculation | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  const validateInputs = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {}
    
    const backOddsNum = parseFloat(backOdds)
    const layOddsNum = parseFloat(layOdds)
    const backStakeNum = parseFloat(backStake)
    const commissionNum = parseFloat(commission)

    if (!backOdds || backOddsNum <= 1 || backOddsNum > 50) {
      newErrors.backOdds = "Back odds must be between 1.01 and 50.00"
    }

    if (!layOdds || layOddsNum <= 1 || layOddsNum > 50) {
      newErrors.layOdds = "Lay odds must be between 1.01 and 50.00"
    }

    if (!backStake || backStakeNum <= 0 || backStakeNum > 10000) {
      newErrors.backStake = "Back stake must be between £0.01 and £10,000"
    }

    if (!commission || commissionNum < 0 || commissionNum > 10) {
      newErrors.commission = "Commission must be between 0% and 10%"
    }

    return newErrors
  }, [backOdds, layOdds, backStake, commission])

  const calculateResults = useCallback((): Calculation | null => {
    const validationErrors = validateInputs()
    if (Object.keys(validationErrors).length > 0) {
      return null
    }

    const backOddsNum = parseFloat(backOdds)
    const layOddsNum = parseFloat(layOdds)
    const backStakeNum = parseFloat(backStake)
    const commissionNum = parseFloat(commission) / 100

    // Calculate lay stake for matched betting
    const layStake = (backStakeNum * backOddsNum) / (layOddsNum - commissionNum)

    // Scenario 1: Team goes 2 up (early payout triggered, back bet wins)
    const backProfit = backStakeNum * (backOddsNum - 1)
    const layLiability = layStake * (layOddsNum - 1)
    const profit2Up = backProfit - layLiability

    // Scenario 2: Lay wins (team doesn't go 2 up or loses after going 2 up)
    const layProfit = layStake * (1 - commissionNum)
    const profitLayWins = layProfit - backStakeNum

    // Scenario 3: Both bets win (team goes 2 up AND wins normally)
    const profitBothWin = backProfit + layProfit

    // Scenario 4: Both bets lose (rare scenario - mainly for completeness)
    const profitBothLose = -backStakeNum - layLiability

    // Qualifying loss (initial matched bet loss before 2UP)
    const qualifyingLoss = backStakeNum - (layStake * (1 - commissionNum))

    // Calculate ROI based on expected value
    const roi = ((profit2Up + profitLayWins) / 2 / backStakeNum) * 100

    // Risk-free check (positive profit in main scenarios)
    const isRiskFree = profit2Up > 0 && profitLayWins > -5 // Allow small QL

    return {
      backStake: backStakeNum,
      layStake: Math.round(layStake * 100) / 100,
      profit2Up: Math.round(profit2Up * 100) / 100,
      profitLayWins: Math.round(profitLayWins * 100) / 100,
      profitBothWin: Math.round(profitBothWin * 100) / 100,
      profitBothLose: Math.round(profitBothLose * 100) / 100,
      qualifyingLoss: Math.round(qualifyingLoss * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      isRiskFree
    }
  }, [backOdds, layOdds, backStake, commission, validateInputs])

  const debouncedCalculate = useCallback(() => {
    setIsCalculating(true)
    const timer = setTimeout(() => {
      const newErrors = validateInputs()
      setErrors(newErrors)
      
      if (Object.keys(newErrors).length === 0) {
        setCalculation(calculateResults())
      } else {
        setCalculation(null)
      }
      setIsCalculating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [validateInputs, calculateResults])

  useEffect(() => {
    const cleanup = debouncedCalculate()
    return cleanup
  }, [debouncedCalculate])

  const handleClear = () => {
    setBackOdds("3.00")
    setLayOdds("3.10")
    setBackStake("100")
    setCommission("2")
    setHedgeAfter2Up(false)
    setErrors({})
    setCalculation(null)
  }

  const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    const formatted = absAmount.toLocaleString('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return isNegative ? `-${formatted}` : formatted
  }

  const getResultColor = (amount: number): string => {
    if (amount > 0) return "text-green-600 dark:text-green-400"
    if (amount < 0) return "text-red-600 dark:text-red-400"
    return "text-gray-600 dark:text-gray-400"
  }

  const getResultBg = (amount: number): string => {
    if (amount > 0) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    if (amount < 0) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    return "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            2UP Calculator
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
              Matched Betting Tool
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Calculate stakes and profits for 2UP promotions with early payout opportunities
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Betting Parameters
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="backOdds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Back Odds (Bookmaker)
                  </label>
                  <input
                    id="backOdds"
                    type="text"
                    inputMode="decimal"
                    value={backOdds}
                    onChange={(e) => setBackOdds(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors ${
                      errors.backOdds ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 3.00"
                  />
                  {errors.backOdds && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.backOdds}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="layOdds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lay Odds (Exchange)
                  </label>
                  <input
                    id="layOdds"
                    type="text"
                    inputMode="decimal"
                    value={layOdds}
                    onChange={(e) => setLayOdds(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors ${
                      errors.layOdds ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 3.10"
                  />
                  {errors.layOdds && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.layOdds}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="backStake" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Back Stake (£)
                  </label>
                  <input
                    id="backStake"
                    type="text"
                    inputMode="decimal"
                    value={backStake}
                    onChange={(e) => setBackStake(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors ${
                      errors.backStake ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 100"
                  />
                  {errors.backStake && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.backStake}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="commission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exchange Commission (%)
                  </label>
                  <input
                    id="commission"
                    type="text"
                    inputMode="decimal"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors ${
                      errors.commission ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 2"
                  />
                  {errors.commission && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.commission}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    id="hedgeAfter2Up"
                    type="checkbox"
                    checked={hedgeAfter2Up}
                    onChange={(e) => setHedgeAfter2Up(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                  />
                  <label htmlFor="hedgeAfter2Up" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hedge only after 2UP trigger
                  </label>
                </div>

                <button
                  onClick={handleClear}
                  className="w-full min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                Results & Analysis
                {isCalculating && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </h3>

              {calculation ? (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">LAY STAKE</div>
                      <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        {formatCurrency(calculation.layStake)}
                      </div>
                    </div>
                    
                    <div className={`p-3 border rounded-lg ${
                      calculation.isRiskFree 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <div className={`text-xs font-medium flex items-center gap-1 ${
                        calculation.isRiskFree 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {calculation.isRiskFree ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        STATUS
                      </div>
                      <div className={`text-sm font-semibold ${
                        calculation.isRiskFree 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {calculation.isRiskFree ? 'Risk-Free' : 'Has Risk'}
                      </div>
                    </div>
                  </div>

                  {/* Profit Scenarios */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profit Scenarios:</h4>
                    
                    <div className={`p-4 border rounded-lg ${getResultBg(calculation.profit2Up)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">2UP Triggered</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Team goes 2 goals ahead</div>
                        </div>
                        <div className={`text-lg font-bold ${getResultColor(calculation.profit2Up)}`}>
                          {formatCurrency(calculation.profit2Up)}
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 border rounded-lg ${getResultBg(calculation.profitLayWins)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Lay Wins</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Team doesn't go 2UP or loses</div>
                        </div>
                        <div className={`text-lg font-bold ${getResultColor(calculation.profitLayWins)}`}>
                          {formatCurrency(calculation.profitLayWins)}
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 border rounded-lg ${getResultBg(calculation.profitBothWin)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Both Win</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">2UP + team wins normally</div>
                        </div>
                        <div className={`text-lg font-bold ${getResultColor(calculation.profitBothWin)}`}>
                          {formatCurrency(calculation.profitBothWin)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">QUALIFYING LOSS</div>
                      <div className={`text-sm font-semibold ${getResultColor(calculation.qualifyingLoss)}`}>
                        {formatCurrency(calculation.qualifyingLoss)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">ROI</div>
                      <div className={`text-sm font-semibold ${getResultColor(calculation.roi)}`}>
                        {calculation.roi.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter valid betting parameters to see calculations</p>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              2UP Strategy Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Best odds differential: Lay odds should be close to back odds for maximum profit</li>
              <li>• Popular bookmakers: Bet365, Paddy Power offer 2UP early payout</li>
              <li>• Optimal teams: Choose attacking teams likely to score first and go 2 goals ahead</li>
              <li>• Timing: Place bets close to kick-off for best exchange liquidity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}