"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, TrendingUp, AlertTriangle, RotateCcw, Info } from "lucide-react"

interface KellyResults {
  kellyPercentage: number
  recommendedStake: number
  expectedValue: number
  profitPotential: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  recommendation: string
}

export default function KellyCriterionMatchedBetting() {
  const [backOdds, setBackOdds] = useState<string>('')
  const [layOdds, setLayOdds] = useState<string>('')
  const [layCommission, setLayCommission] = useState<string>('5')
  const [bankroll, setBankroll] = useState<string>('')
  const [maxKelly, setMaxKelly] = useState<string>('25')
  const [results, setResults] = useState<KellyResults | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCalculating, setIsCalculating] = useState(false)

  const validateInputs = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const backOddsNum = parseFloat(backOdds)
    const layOddsNum = parseFloat(layOdds)
    const commissionNum = parseFloat(layCommission)
    const bankrollNum = parseFloat(bankroll)
    const maxKellyNum = parseFloat(maxKelly)

    if (!backOdds || backOddsNum <= 1) {
      newErrors.backOdds = 'Back odds must be greater than 1.00'
    }

    if (!layOdds || layOddsNum <= 1) {
      newErrors.layOdds = 'Lay odds must be greater than 1.00'
    }

    if (backOddsNum && layOddsNum && backOddsNum >= layOddsNum) {
      newErrors.layOdds = 'Lay odds should typically be higher than back odds'
    }

    if (!layCommission || commissionNum < 0 || commissionNum > 50) {
      newErrors.layCommission = 'Commission must be between 0% and 50%'
    }

    if (!bankroll || bankrollNum <= 0) {
      newErrors.bankroll = 'Bankroll must be greater than 0'
    }

    if (!maxKelly || maxKellyNum <= 0 || maxKellyNum > 100) {
      newErrors.maxKelly = 'Max Kelly must be between 0% and 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [backOdds, layOdds, layCommission, bankroll, maxKelly])

  const calculateKelly = useCallback(() => {
    if (!validateInputs()) {
      setResults(null)
      return
    }

    setIsCalculating(true)

    setTimeout(() => {
      const backOddsNum = parseFloat(backOdds)
      const layOddsNum = parseFloat(layOdds)
      const commissionNum = parseFloat(layCommission) / 100
      const bankrollNum = parseFloat(bankroll)
      const maxKellyNum = parseFloat(maxKelly) / 100

      // Calculate implied probabilities
      const backImpliedProb = 1 / backOddsNum
      const layImpliedProb = 1 / layOddsNum

      // Calculate true probability (accounting for commission)
      const netLayOdds = layOddsNum / (1 - commissionNum)
      const arbitrageMargin = backImpliedProb + (1 / netLayOdds)
      
      // For matched betting, we assume the true probability is the average
      // of back and lay implied probabilities, adjusted for commission
      const trueProbability = (backImpliedProb + layImpliedProb) / 2

      // Kelly Criterion calculation: f* = (bp - q) / b
      // where b = net odds - 1, p = true probability, q = 1 - p
      const b = backOddsNum - 1
      const p = trueProbability
      const q = 1 - p

      const kellyFraction = (b * p - q) / b
      const kellyPercentage = Math.max(0, kellyFraction * 100)

      // Apply maximum Kelly limit
      const cappedKellyPercentage = Math.min(kellyPercentage, maxKellyNum * 100)
      
      const recommendedStake = (cappedKellyPercentage / 100) * bankrollNum
      
      // Calculate expected value
      const expectedValue = (p * (backOddsNum - 1) - q) * recommendedStake

      // Calculate profit potential
      const profitPotential = recommendedStake * (backOddsNum - 1) * p

      // Determine risk level
      let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
      let recommendation: string

      if (cappedKellyPercentage < 5) {
        riskLevel = 'Low'
        recommendation = 'Conservative approach. Suitable for risk-averse matched bettors.'
      } else if (cappedKellyPercentage < 15) {
        riskLevel = 'Medium'
        recommendation = 'Moderate risk. Good balance between growth and safety.'
      } else if (cappedKellyPercentage < 25) {
        riskLevel = 'High'
        recommendation = 'Aggressive approach. Higher potential returns with increased risk.'
      } else {
        riskLevel = 'Very High'
        recommendation = 'Very aggressive. Consider reducing stake size for better risk management.'
      }

      // Special case for matched betting
      if (arbitrageMargin < 1) {
        recommendation = 'Arbitrage opportunity detected! This is a guaranteed profit situation.'
        riskLevel = 'Low'
      }

      setResults({
        kellyPercentage: cappedKellyPercentage,
        recommendedStake,
        expectedValue,
        profitPotential,
        riskLevel,
        recommendation
      })

      setIsCalculating(false)
    }, 300)
  }, [backOdds, layOdds, layCommission, bankroll, maxKelly, validateInputs])

  useEffect(() => {
    if (backOdds && layOdds && layCommission && bankroll && maxKelly) {
      calculateKelly()
    }
  }, [calculateKelly, backOdds, layOdds, layCommission, bankroll, maxKelly])

  const clearAll = () => {
    setBackOdds('')
    setLayOdds('')
    setLayCommission('5')
    setBankroll('')
    setMaxKelly('25')
    setResults(null)
    setErrors({})
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 dark:text-green-400'
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'High': return 'text-orange-600 dark:text-orange-400'
      case 'Very High': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Kelly Criterion Calculator - Matched Betting
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Calculate optimal bet sizing for matched betting using the Kelly Criterion formula
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Betting Parameters
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Back Odds (Bookmaker)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={backOdds}
                  onChange={(e) => setBackOdds(e.target.value)}
                  className={`w-full h-12 px-4 text-base border rounded-md ${
                    errors.backOdds 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                  placeholder="e.g. 2.50"
                />
                {errors.backOdds && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.backOdds}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lay Odds (Exchange)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={layOdds}
                  onChange={(e) => setLayOdds(e.target.value)}
                  className={`w-full h-12 px-4 text-base border rounded-md ${
                    errors.layOdds 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                  placeholder="e.g. 2.60"
                />
                {errors.layOdds && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.layOdds}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exchange Commission (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={layCommission}
                  onChange={(e) => setLayCommission(e.target.value)}
                  className={`w-full h-12 px-4 text-base border rounded-md ${
                    errors.layCommission 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                  placeholder="5.0"
                />
                {errors.layCommission && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.layCommission}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Bankroll (£)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  className={`w-full h-12 px-4 text-base border rounded-md ${
                    errors.bankroll 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                  placeholder="1000"
                />
                {errors.bankroll && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.bankroll}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Kelly % (Risk Limiter)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={maxKelly}
                  onChange={(e) => setMaxKelly(e.target.value)}
                  className={`w-full h-12 px-4 text-base border rounded-md ${
                    errors.maxKelly 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                  placeholder="25"
                />
                {errors.maxKelly && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.maxKelly}
                  </p>
                )}
              </div>

              <button
                onClick={clearAll}
                className="w-full min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Kelly Calculation Results
              </h3>

              {isCalculating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Calculating...</span>
                </div>
              ) : results ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">Kelly Percentage</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results.kellyPercentage.toFixed(2)}%
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-900 dark:text-green-100">Recommended Stake</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      £{results.recommendedStake.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Value</div>
                      <div className={`text-lg font-semibold ${
                        results.expectedValue >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        £{results.expectedValue.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit Potential</div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        £{results.profitPotential.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Risk Assessment</span>
                    </div>
                    <div className={`text-lg font-semibold mb-2 ${getRiskColor(results.riskLevel)}`}>
                      {results.riskLevel} Risk
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {results.recommendation}
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Matched Betting Tips
                        </div>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                          <p>• Always calculate lay stakes separately to ensure qualifying loss coverage</p>
                          <p>• Consider exchange liquidity when placing large stakes</p>
                          <p>• Factor in withdrawal fees and minimum bet requirements</p>
                          <p>• Never exceed your comfortable risk tolerance, regardless of Kelly recommendation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter betting parameters to calculate optimal stake size</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}