"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, DollarSign, TrendingUp, AlertCircle, RotateCcw, HelpCircle } from "lucide-react"

interface CalculationResults {
  layStake: number
  liability: number
  profit: number
  profitIfBackWins: number
  profitIfLayWins: number
}

interface FormData {
  freeStakeAmount: string
  backOdds: string
  layOdds: string
  layCommission: string
  backCommission: string
}

interface FormErrors {
  freeStakeAmount?: string
  backOdds?: string
  layOdds?: string
  layCommission?: string
  backCommission?: string
}

export default function FreeBetCalculator() {
  const [stakeMode, setStakeMode] = useState<'snr' | 'sr'>('snr')
  const [isCalculating, setIsCalculating] = useState(false)
  const [currency, setCurrency] = useState('$')
  
  const [formData, setFormData] = useState<FormData>({
    freeStakeAmount: '',
    backOdds: '',
    layOdds: '',
    layCommission: '5',
    backCommission: '0'
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [results, setResults] = useState<CalculationResults | null>(null)

  const validateInputs = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {}
    
    const stake = parseFloat(data.freeStakeAmount)
    if (!data.freeStakeAmount || isNaN(stake) || stake <= 0) {
      errors.freeStakeAmount = 'Enter a valid free bet amount'
    }

    const backOdds = parseFloat(data.backOdds)
    if (!data.backOdds || isNaN(backOdds) || backOdds < 1) {
      errors.backOdds = 'Back odds must be 1.0 or higher'
    }

    const layOdds = parseFloat(data.layOdds)
    if (!data.layOdds || isNaN(layOdds) || layOdds < 1) {
      errors.layOdds = 'Lay odds must be 1.0 or higher'
    }

    if (backOdds && layOdds && layOdds < backOdds) {
      errors.layOdds = 'Lay odds should typically be higher than back odds'
    }

    const layComm = parseFloat(data.layCommission)
    if (isNaN(layComm) || layComm < 0 || layComm > 100) {
      errors.layCommission = 'Commission must be between 0-100%'
    }

    const backComm = parseFloat(data.backCommission)
    if (isNaN(backComm) || backComm < 0 || backComm > 100) {
      errors.backCommission = 'Commission must be between 0-100%'
    }

    return errors
  }, [])

  const calculateResults = useCallback((data: FormData): CalculationResults | null => {
    const validationErrors = validateInputs(data)
    if (Object.keys(validationErrors).length > 0) {
      return null
    }

    const freeStake = parseFloat(data.freeStakeAmount)
    const backOdds = parseFloat(data.backOdds)
    const layOdds = parseFloat(data.layOdds)
    const layCommissionRate = parseFloat(data.layCommission) / 100
    const backCommissionRate = parseFloat(data.backCommission) / 100

    // Calculate optimal lay stake
    let layStake: number
    
    if (stakeMode === 'snr') {
      // Stake Not Returned - most common
      layStake = (freeStake * (backOdds - 1)) / (layOdds - layCommissionRate * (layOdds - 1))
    } else {
      // Stake Returned
      layStake = (freeStake * backOdds) / (layOdds - layCommissionRate * (layOdds - 1))
    }

    const liability = layStake * (layOdds - 1)

    // Calculate profits for both outcomes
    let profitIfBackWins: number
    let profitIfLayWins: number

    if (stakeMode === 'snr') {
      // If back bet wins (free bet wins, lay bet loses)
      const backWinnings = freeStake * (backOdds - 1) * (1 - backCommissionRate)
      profitIfBackWins = backWinnings - liability

      // If lay bet wins (free bet loses, lay bet wins)
      const layWinnings = layStake * (1 - layCommissionRate)
      profitIfLayWins = layWinnings
    } else {
      // Stake Returned mode
      const backWinnings = freeStake * backOdds * (1 - backCommissionRate)
      profitIfBackWins = backWinnings - liability

      const layWinnings = layStake * (1 - layCommissionRate)
      profitIfLayWins = layWinnings
    }

    const profit = Math.min(profitIfBackWins, profitIfLayWins)

    return {
      layStake: Math.round(layStake * 100) / 100,
      liability: Math.round(liability * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitIfBackWins: Math.round(profitIfBackWins * 100) / 100,
      profitIfLayWins: Math.round(profitIfLayWins * 100) / 100
    }
  }, [stakeMode, validateInputs])

  const debouncedCalculate = useCallback(() => {
    const timeoutId = setTimeout(() => {
      setIsCalculating(true)
      const validationErrors = validateInputs(formData)
      setErrors(validationErrors)
      
      if (Object.keys(validationErrors).length === 0) {
        const calculationResults = calculateResults(formData)
        setResults(calculationResults)
      } else {
        setResults(null)
      }
      
      setTimeout(() => setIsCalculating(false), 100)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [formData, calculateResults, validateInputs])

  useEffect(() => {
    const cleanup = debouncedCalculate()
    return cleanup
  }, [debouncedCalculate])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFormData({
      freeStakeAmount: '',
      backOdds: '',
      layOdds: '',
      layCommission: '5',
      backCommission: '0'
    })
    setResults(null)
    setErrors({})
  }

  const formatCurrency = (amount: number): string => {
    return `${currency}${Math.abs(amount).toFixed(2)}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Free Bet Calculator
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Calculate optimal lay stakes to guarantee profit from free bets
          </p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Free Bet Mode</h3>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 hidden group-hover:block bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md p-2 w-64 z-10">
                  <strong>SNR:</strong> Stake Not Returned (most common) - you only receive winnings, not the stake back<br/>
                  <strong>SR:</strong> Stake Returned - rare promotions where you get the stake back too
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStakeMode('snr')}
                className={`min-h-[44px] px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  stakeMode === 'snr'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Stake Not Returned (SNR)
              </button>
              <button
                onClick={() => setStakeMode('sr')}
                className={`min-h-[44px] px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  stakeMode === 'sr'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Stake Returned (SR)
              </button>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                Bet Details
              </h3>
              
              <div className="space-y-4">
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                  >
                    <option value="$">USD ($)</option>
                    <option value="£">GBP (£)</option>
                    <option value="€">EUR (€)</option>
                    <option value="A$">AUD (A$)</option>
                    <option value="C$">CAD (C$)</option>
                  </select>
                </div>

                {/* Free Bet Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Free Bet Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="25.00"
                    value={formData.freeStakeAmount}
                    onChange={(e) => handleInputChange('freeStakeAmount', e.target.value)}
                    className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 ${
                      errors.freeStakeAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.freeStakeAmount && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {errors.freeStakeAmount}
                    </div>
                  )}
                </div>

                {/* Back Odds */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds (Bookmaker)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="4.00"
                    value={formData.backOdds}
                    onChange={(e) => handleInputChange('backOdds', e.target.value)}
                    className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 ${
                      errors.backOdds ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.backOdds && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {errors.backOdds}
                    </div>
                  )}
                </div>

                {/* Lay Odds */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds (Exchange)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="4.20"
                    value={formData.layOdds}
                    onChange={(e) => handleInputChange('layOdds', e.target.value)}
                    className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 ${
                      errors.layOdds ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.layOdds && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {errors.layOdds}
                    </div>
                  )}
                </div>

                {/* Commissions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lay Commission (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="5.0"
                      value={formData.layCommission}
                      onChange={(e) => handleInputChange('layCommission', e.target.value)}
                      className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 ${
                        errors.layCommission ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.layCommission && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.layCommission}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Back Commission (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={formData.backCommission}
                      onChange={(e) => handleInputChange('backCommission', e.target.value)}
                      className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-700 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 ${
                        errors.backCommission ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.backCommission && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.backCommission}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Results
                {isCalculating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </h3>

              {results ? (
                <div className="space-y-3">
                  {/* Guaranteed Profit */}
                  <div className={`p-4 rounded-lg border-2 ${
                    results.profit > 0 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : results.profit < 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Guaranteed Profit
                    </div>
                    <div className={`text-2xl font-bold ${
                      results.profit > 0 
                        ? 'text-green-700 dark:text-green-400' 
                        : results.profit < 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {results.profit >= 0 ? '+' : '-'}{formatCurrency(results.profit)}
                    </div>
                  </div>

                  {/* Key Calculations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Lay Stake
                      </div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(results.layStake)}
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Liability
                      </div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                        {formatCurrency(results.liability)}
                      </div>
                    </div>
                  </div>

                  {/* Profit Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profit Breakdown:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-gray-600 dark:text-gray-400">
                          If Back Bet Wins:
                        </div>
                        <div className={`font-semibold ${
                          results.profitIfBackWins >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {results.profitIfBackWins >= 0 ? '+' : '-'}{formatCurrency(results.profitIfBackWins)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-gray-600 dark:text-gray-400">
                          If Lay Bet Wins:
                        </div>
                        <div className={`font-semibold ${
                          results.profitIfLayWins >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {results.profitIfLayWins >= 0 ? '+' : '-'}{formatCurrency(results.profitIfLayWins)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {results.profit > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Instructions:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Place your free bet of {formatCurrency(parseFloat(formData.freeStakeAmount || '0'))} at odds {formData.backOdds}</li>
                          <li>Place a lay bet of {formatCurrency(results.layStake)} at odds {formData.layOdds}</li>
                          <li>Ensure you have {formatCurrency(results.liability)} available to cover liability</li>
                          <li>Guaranteed profit: {formatCurrency(results.profit)} regardless of outcome!</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your bet details to see calculations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}