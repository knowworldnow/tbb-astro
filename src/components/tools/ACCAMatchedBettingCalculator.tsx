"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, Plus, Trash2, RotateCcw, TrendingUp, Shield, Info } from "lucide-react"

interface AccaLeg {
  id: string
  backOdds: string
  layOdds: string
  selection: string
}

interface CalculationResult {
  totalBackStake: number
  totalLayStake: number
  totalLiability: number
  profitAllWin: number
  profitOneLose: number
  profitTwoOrMoreLose: number
  refundValue: number
  layStakePerLeg: number[]
  liabilityPerLeg: number[]
}

export default function AccaMatchedBettingCalculator() {
  const [legs, setLegs] = useState<AccaLeg[]>([
    { id: '1', backOdds: '', layOdds: '', selection: '' },
    { id: '2', backOdds: '', layOdds: '', selection: '' },
    { id: '3', backOdds: '', layOdds: '', selection: '' },
    { id: '4', backOdds: '', layOdds: '', selection: '' }
  ])
  
  const [backStake, setBackStake] = useState<string>('10')
  const [layCommission, setLayCommission] = useState<string>('2')
  const [refundType, setRefundType] = useState<'cash' | 'freebet'>('freebet')
  const [freeBetSNR, setFreeBetSNR] = useState<string>('70')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateInputs = useCallback(() => {
    const newErrors: { [key: string]: string } = {}
    
    if (!backStake || parseFloat(backStake) <= 0) {
      newErrors.backStake = 'Please enter a valid back stake'
    }
    
    if (!layCommission || parseFloat(layCommission) < 0 || parseFloat(layCommission) > 100) {
      newErrors.layCommission = 'Commission must be between 0-100%'
    }
    
    legs.forEach((leg, index) => {
      if (!leg.backOdds || parseFloat(leg.backOdds) < 1.01) {
        newErrors[`backOdds${index}`] = 'Back odds must be ≥ 1.01'
      }
      if (!leg.layOdds || parseFloat(leg.layOdds) < 1.01) {
        newErrors[`layOdds${index}`] = 'Lay odds must be ≥ 1.01'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [backStake, layCommission, legs])

  const calculateResults = useCallback(() => {
    if (!validateInputs()) return
    
    setCalculating(true)
    
    setTimeout(() => {
      const stake = parseFloat(backStake)
      const commission = parseFloat(layCommission) / 100
      const freeBetReturn = parseFloat(freeBetSNR) / 100
      
      // Calculate combined back odds
      const combinedBackOdds = legs.reduce((acc, leg) => {
        const odds = parseFloat(leg.backOdds) || 1
        return acc * odds
      }, 1)
      
      // Calculate combined lay odds
      const combinedLayOdds = legs.reduce((acc, leg) => {
        const odds = parseFloat(leg.layOdds) || 1
        return acc * odds
      }, 1)
      
      // Calculate lay stake to cover the back bet
      const layStake = (stake * combinedBackOdds) / combinedLayOdds
      const liability = layStake * (combinedLayOdds - 1)
      
      // Calculate individual leg lay stakes (simplified approach)
      const layStakePerLeg = legs.map((leg, index) => {
        const legBackOdds = parseFloat(leg.backOdds) || 1
        const legLayOdds = parseFloat(leg.layOdds) || 1
        return (stake * legBackOdds) / legLayOdds / legs.length
      })
      
      const liabilityPerLeg = layStakePerLeg.map((layStake, index) => {
        const legLayOdds = parseFloat(legs[index].layOdds) || 1
        return layStake * (legLayOdds - 1)
      })
      
      // Profit scenarios
      const backWinnings = stake * (combinedBackOdds - 1)
      const layLoss = liability
      const layCommissionCost = layStake * commission
      
      const profitAllWin = backWinnings - layLoss - layCommissionCost
      
      // If one leg loses, get refund
      const refundValue = refundType === 'cash' ? stake : stake * freeBetReturn
      const profitOneLose = refundValue - layCommissionCost
      
      // If two or more legs lose
      const profitTwoOrMoreLose = -stake - layCommissionCost
      
      setResult({
        totalBackStake: stake,
        totalLayStake: layStake,
        totalLiability: liability,
        profitAllWin,
        profitOneLose,
        profitTwoOrMoreLose,
        refundValue,
        layStakePerLeg,
        liabilityPerLeg
      })
      
      setCalculating(false)
    }, 300)
  }, [backStake, layCommission, freeBetSNR, refundType, legs, validateInputs])

  useEffect(() => {
    calculateResults()
  }, [calculateResults])

  const addLeg = () => {
    if (legs.length < 8) {
      setLegs([...legs, { 
        id: (legs.length + 1).toString(), 
        backOdds: '', 
        layOdds: '', 
        selection: '' 
      }])
    }
  }

  const removeLeg = (id: string) => {
    if (legs.length > 2) {
      setLegs(legs.filter(leg => leg.id !== id))
    }
  }

  const updateLeg = (id: string, field: keyof AccaLeg, value: string) => {
    setLegs(legs.map(leg => 
      leg.id === id ? { ...leg, [field]: value } : leg
    ))
  }

  const clearAll = () => {
    setLegs([
      { id: '1', backOdds: '', layOdds: '', selection: '' },
      { id: '2', backOdds: '', layOdds: '', selection: '' },
      { id: '3', backOdds: '', layOdds: '', selection: '' },
      { id: '4', backOdds: '', layOdds: '', selection: '' }
    ])
    setBackStake('10')
    setLayCommission('2')
    setFreeBetSNR('70')
    setResult(null)
    setErrors({})
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getResultColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400'
    if (value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getResultBg = (value: number) => {
    if (value > 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (value < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ACCA Matched Betting Calculator
            </h1>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Calculate profits and lay stakes for accumulator insurance offers
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Settings Section */}
            <div className="xl:col-span-1 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Back Stake
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={backStake}
                    onChange={(e) => setBackStake(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                      errors.backStake ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="10.00"
                  />
                  {errors.backStake && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.backStake}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lay Commission (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={layCommission}
                    onChange={(e) => setLayCommission(e.target.value)}
                    className={`w-full h-12 px-4 text-base border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                      errors.layCommission ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="2.0"
                  />
                  {errors.layCommission && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.layCommission}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Refund Type
                  </label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as 'cash' | 'freebet')}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="freebet">Free Bet</option>
                    <option value="cash">Cash Refund</option>
                  </select>
                </div>

                {refundType === 'freebet' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Free Bet Return (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={freeBetSNR}
                      onChange={(e) => setFreeBetSNR(e.target.value)}
                      className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="70"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Expected return from free bet conversion
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Legs Section */}
            <div className="xl:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Accumulator Legs</h2>
                <button
                  onClick={addLeg}
                  disabled={legs.length >= 8}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Leg
                </button>
              </div>

              <div className="space-y-3">
                {legs.map((leg, index) => (
                  <div key={leg.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Leg {index + 1}
                      </span>
                      {legs.length > 2 && (
                        <button
                          onClick={() => removeLeg(leg.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={leg.selection}
                        onChange={(e) => updateLeg(leg.id, 'selection', e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Selection name"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Back Odds
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={leg.backOdds}
                            onChange={(e) => updateLeg(leg.id, 'backOdds', e.target.value)}
                            className={`w-full h-10 px-3 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                              errors[`backOdds${index}`] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="2.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Lay Odds
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={leg.layOdds}
                            onChange={(e) => updateLeg(leg.id, 'layOdds', e.target.value)}
                            className={`w-full h-10 px-3 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${
                              errors[`layOdds${index}`] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="2.10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Section */}
            <div className="xl:col-span-1 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Results</h2>
              
              {calculating ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Calculating...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Stake Summary</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Back Stake:</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{formatCurrency(result.totalBackStake)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Total Lay Stake:</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{formatCurrency(result.totalLayStake)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Total Liability:</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{formatCurrency(result.totalLiability)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getResultBg(result.profitAllWin)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-4 h-4 ${getResultColor(result.profitAllWin)}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">All Legs Win</span>
                    </div>
                    <div className={`text-lg font-bold ${getResultColor(result.profitAllWin)}`}>
                      {formatCurrency(result.profitAllWin)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getResultBg(result.profitOneLose)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-4 h-4 ${getResultColor(result.profitOneLose)}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">One Leg Loses (Refund)</span>
                    </div>
                    <div className={`text-lg font-bold ${getResultColor(result.profitOneLose)}`}>
                      {formatCurrency(result.profitOneLose)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Refund: {formatCurrency(result.refundValue)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getResultBg(result.profitTwoOrMoreLose)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-4 h-4 rounded-full ${result.profitTwoOrMoreLose < 0 ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Two+ Legs Lose</span>
                    </div>
                    <div className={`text-lg font-bold ${getResultColor(result.profitTwoOrMoreLose)}`}>
                      {formatCurrency(result.profitTwoOrMoreLose)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      No refund available
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Enter odds to see calculations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}