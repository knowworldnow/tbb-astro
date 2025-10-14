"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, TrendingUp, AlertCircle, RotateCcw, Target } from "lucide-react"

interface EachWayBet {
  backOdds: number
  layOdds: number
  placeTerms: string
  placeOdds: number
  layPlaceOdds: number
  stake: number
  commission: number
}

interface Results {
  winProfit: number
  placeProfit: number
  totalReturn: number
  roi: number
  arbRating: number
  isArb: boolean
  isValueBet: boolean
}

export default function EachWayMatcher() {
  const [bet, setBet] = useState<EachWayBet>({
    backOdds: 5.0,
    layOdds: 5.2,
    placeTerms: "1/4",
    placeOdds: 2.25,
    layPlaceOdds: 2.4,
    stake: 20,
    commission: 2.0
  })

  const [results, setResults] = useState<Results>({
    winProfit: 0,
    placeProfit: 0,
    totalReturn: 0,
    roi: 0,
    arbRating: 0,
    isArb: false,
    isValueBet: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCalculating, setIsCalculating] = useState(false)

  const validateInputs = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (bet.backOdds <= 1) newErrors.backOdds = "Back odds must be greater than 1.0"
    if (bet.layOdds <= 1) newErrors.layOdds = "Lay odds must be greater than 1.0"
    if (bet.placeOdds <= 1) newErrors.placeOdds = "Place odds must be greater than 1.0"
    if (bet.layPlaceOdds <= 1) newErrors.layPlaceOdds = "Lay place odds must be greater than 1.0"
    if (bet.stake <= 0) newErrors.stake = "Stake must be greater than 0"
    if (bet.commission < 0 || bet.commission > 10) newErrors.commission = "Commission must be between 0-10%"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [bet])

  const calculateResults = useCallback(() => {
    if (!validateInputs()) return

    setIsCalculating(true)

    // Calculate place terms multiplier
    const placeMultiplier = bet.placeTerms === "1/4" ? 0.25 : bet.placeTerms === "1/5" ? 0.2 : 0.25

    // Each way bet splits stake equally between win and place
    const winStake = bet.stake / 2
    const placeStake = bet.stake / 2

    // Calculate lay stakes
    const winLayStake = (winStake * bet.backOdds) / bet.layOdds
    const placeLayStake = (placeStake * bet.placeOdds) / bet.layPlaceOdds

    // Calculate commission
    const commissionRate = bet.commission / 100

    // Win scenarios
    const winBackReturn = winStake * (bet.backOdds - 1)
    const winLayLoss = winLayStake * (bet.layOdds - 1) * (1 - commissionRate)
    const placeBackReturn = placeStake * (bet.placeOdds - 1)
    const placeLayLoss = placeLayStake * (bet.layPlaceOdds - 1) * (1 - commissionRate)

    // Calculate different outcomes
    const winProfit = winBackReturn + placeBackReturn - winLayLoss - placeLayLoss - bet.stake
    const placeOnlyProfit = placeBackReturn - winLayStake - placeLayLoss - bet.stake
    const loseProfit = -winLayStake - placeLayStake - bet.stake

    // Calculate average expected return and ROI
    const totalReturn = (winProfit + placeOnlyProfit + loseProfit) / 3
    const roi = (totalReturn / bet.stake) * 100

    // Calculate arbitrage rating
    const winImpliedProb = 1 / bet.backOdds
    const layImpliedProb = 1 / bet.layOdds
    const placeImpliedProb = 1 / bet.placeOdds
    const layPlaceImpliedProb = 1 / bet.layPlaceOdds

    const arbRating = ((winImpliedProb + layImpliedProb + placeImpliedProb + layPlaceImpliedProb) / 2) * 100

    const newResults: Results = {
      winProfit: Math.round(winProfit * 100) / 100,
      placeProfit: Math.round(placeOnlyProfit * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      arbRating: Math.round(arbRating * 100) / 100,
      isArb: arbRating < 100,
      isValueBet: roi > 5
    }

    setTimeout(() => {
      setResults(newResults)
      setIsCalculating(false)
    }, 300)
  }, [bet, validateInputs])

  useEffect(() => {
    const timer = setTimeout(calculateResults, 300)
    return () => clearTimeout(timer)
  }, [calculateResults])

  const resetForm = () => {
    setBet({
      backOdds: 5.0,
      layOdds: 5.2,
      placeTerms: "1/4",
      placeOdds: 2.25,
      layPlaceOdds: 2.4,
      stake: 20,
      commission: 2.0
    })
    setErrors({})
  }

  const updateBet = (field: keyof EachWayBet, value: string | number) => {
    setBet(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Each Way Matcher
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Find profitable each-way betting opportunities and calculate optimal stakes
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Bet Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds (Win)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1.01"
                    value={bet.backOdds}
                    onChange={(e) => updateBet('backOdds', parseFloat(e.target.value) || 0)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                      errors.backOdds ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.backOdds && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.backOdds}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds (Win)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1.01"
                    value={bet.layOdds}
                    onChange={(e) => updateBet('layOdds', parseFloat(e.target.value) || 0)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                      errors.layOdds ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.layOdds && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.layOdds}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Place Terms
                  </label>
                  <select
                    value={bet.placeTerms}
                    onChange={(e) => updateBet('placeTerms', e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                  >
                    <option value="1/4">1/4 Odds</option>
                    <option value="1/5">1/5 Odds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    max="10"
                    value={bet.commission}
                    onChange={(e) => updateBet('commission', parseFloat(e.target.value) || 0)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                      errors.commission ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.commission && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.commission}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds (Place)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1.01"
                    value={bet.placeOdds}
                    onChange={(e) => updateBet('placeOdds', parseFloat(e.target.value) || 0)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                      errors.placeOdds ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.placeOdds && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.placeOdds}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds (Place)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1.01"
                    value={bet.layPlaceOdds}
                    onChange={(e) => updateBet('layPlaceOdds', parseFloat(e.target.value) || 0)}
                    className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                      errors.layPlaceOdds ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.layPlaceOdds && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.layPlaceOdds}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Stake (£)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="1"
                  value={bet.stake}
                  onChange={(e) => updateBet('stake', parseFloat(e.target.value) || 0)}
                  className={`w-full h-12 px-4 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                    errors.stake ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.stake && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.stake}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Split equally: £{(bet.stake / 2).toFixed(2)} win, £{(bet.stake / 2).toFixed(2)} place
                </p>
              </div>

              <button
                onClick={resetForm}
                className="w-full min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Form
              </button>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Results Analysis
                {isCalculating && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </h3>

              {/* Opportunity Status */}
              <div className={`p-4 rounded-lg border-2 ${
                results.isArb 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : results.isValueBet 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className={`w-5 h-5 ${
                    results.isArb ? 'text-green-600 dark:text-green-400' : 
                    results.isValueBet ? 'text-blue-600 dark:text-blue-400' : 
                    'text-red-600 dark:text-red-400'
                  }`} />
                  <span className={`font-semibold ${
                    results.isArb ? 'text-green-800 dark:text-green-300' : 
                    results.isValueBet ? 'text-blue-800 dark:text-blue-300' : 
                    'text-red-800 dark:text-red-300'
                  }`}>
                    {results.isArb ? 'Arbitrage Opportunity!' : 
                     results.isValueBet ? 'Value Bet Found!' : 
                     'No Clear Opportunity'}
                  </span>
                </div>
                <p className={`text-sm ${
                  results.isArb ? 'text-green-700 dark:text-green-400' : 
                  results.isValueBet ? 'text-blue-700 dark:text-blue-400' : 
                  'text-red-700 dark:text-red-400'
                }`}>
                  {results.isArb ? 'Guaranteed profit regardless of outcome' : 
                   results.isValueBet ? 'Positive expected value detected' : 
                   'Consider different odds or stakes'}
                </p>
              </div>

              {/* Profit Scenarios */}
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horse Wins & Places</span>
                    <span className={`font-semibold ${
                      results.winProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      £{results.winProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horse Places Only</span>
                    <span className={`font-semibold ${
                      results.placeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      £{results.placeProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horse Loses</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      -£{bet.stake.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results.roi.toFixed(2)}%
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">ROI</div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {results.arbRating.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Arb Rating</div>
                  </div>
                </div>
              </div>

              {/* Expected Return */}
              <div className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Return</span>
                  <span className={`text-lg font-bold ${
                    results.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    £{results.totalReturn.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Average across all possible outcomes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}