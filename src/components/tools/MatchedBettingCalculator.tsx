"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Calculator, RefreshCw, TrendingUp, AlertTriangle, Info, DollarSign } from "lucide-react"

interface BetType {
  id: string
  name: string
  description: string
}

interface CalculationResult {
  layStake: number
  liability: number
  backWinProfit: number
  layWinProfit: number
  qualifyingLoss: number
  guaranteedProfit: number
  freeReturnValue: number
}

interface Odds {
  back: number
  lay: number
}

export default function MatchedBettingCalculator() {
  const [betType, setBetType] = useState("qualifying")
  const [backStake, setBackStake] = useState("")
  const [backOdds, setBackOdds] = useState("")
  const [layOdds, setLayOdds] = useState("")
  const [commission, setCommission] = useState("2")
  const [oddsFormat, setOddsFormat] = useState("decimal")
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const betTypes: BetType[] = [
    {
      id: "qualifying",
      name: "Qualifying Bet",
      description: "Calculate the qualifying loss when placing initial bet to unlock bonus"
    },
    {
      id: "free_snr",
      name: "Free Bet (SNR)",
      description: "Stake Not Returned - stake is not returned with winnings"
    },
    {
      id: "free_sr",
      name: "Free Bet (SR)",
      description: "Stake Returned - stake is returned with winnings"
    },
    {
      id: "risk_free",
      name: "Risk-Free Bet",
      description: "Get refund if bet loses - calculate optimal profit"
    }
  ]

  const validateInputs = useCallback(() => {
    const newErrors: {[key: string]: string} = {}
    
    if (!backStake || parseFloat(backStake) <= 0) {
      newErrors.backStake = "Back stake must be greater than 0"
    }
    
    if (!backOdds || parseFloat(backOdds) <= 1) {
      newErrors.backOdds = "Back odds must be greater than 1.00"
    }
    
    if (!layOdds || parseFloat(layOdds) <= 1) {
      newErrors.layOdds = "Lay odds must be greater than 1.00"
    }
    
    if (!commission || parseFloat(commission) < 0 || parseFloat(commission) > 10) {
      newErrors.commission = "Commission must be between 0-10%"
    }
    
    // Check if lay odds are higher than back odds (ideal scenario)
    if (backOdds && layOdds && parseFloat(layOdds) < parseFloat(backOdds)) {
      newErrors.general = "Warning: Lay odds are lower than back odds - this may not be profitable"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [backStake, backOdds, layOdds, commission])

  const calculateMatchedBet = useCallback(() => {
    if (!validateInputs()) return null

    const stake = parseFloat(backStake)
    const bOdds = parseFloat(backOdds)
    const lOdds = parseFloat(layOdds)
    const comm = parseFloat(commission) / 100

    let layStake: number
    let liability: number
    let backWinProfit: number
    let layWinProfit: number
    let qualifyingLoss: number
    let guaranteedProfit: number
    let freeReturnValue: number = 0

    switch (betType) {
      case "qualifying":
        // Standard qualifying bet calculation
        layStake = (stake * bOdds) / (lOdds - comm)
        liability = layStake * (lOdds - 1)
        backWinProfit = (stake * (bOdds - 1)) - layStake
        layWinProfit = layStake - (layStake * comm) - stake
        qualifyingLoss = Math.abs(Math.min(backWinProfit, layWinProfit))
        guaranteedProfit = 0
        break

      case "free_snr":
        // Free bet - stake not returned
        layStake = (stake * (bOdds - 1)) / (lOdds - comm)
        liability = layStake * (lOdds - 1)
        backWinProfit = (stake * (bOdds - 1)) - layStake
        layWinProfit = layStake - (layStake * comm)
        guaranteedProfit = Math.min(backWinProfit, layWinProfit)
        qualifyingLoss = 0
        freeReturnValue = guaranteedProfit
        break

      case "free_sr":
        // Free bet - stake returned
        layStake = (stake * bOdds) / (lOdds - comm)
        liability = layStake * (lOdds - 1)
        backWinProfit = (stake * bOdds) - layStake
        layWinProfit = layStake - (layStake * comm)
        guaranteedProfit = Math.min(backWinProfit, layWinProfit)
        qualifyingLoss = 0
        freeReturnValue = guaranteedProfit
        break

      case "risk_free":
        // Risk-free bet calculation
        layStake = (stake * bOdds) / (lOdds - comm)
        liability = layStake * (lOdds - 1)
        backWinProfit = (stake * (bOdds - 1)) - layStake
        layWinProfit = layStake - (layStake * comm) - stake
        // If back loses, we get refund, so we only lose lay stake
        const refundScenario = -layStake + (layStake * (1 - comm))
        guaranteedProfit = Math.min(backWinProfit, refundScenario)
        qualifyingLoss = guaranteedProfit < 0 ? Math.abs(guaranteedProfit) : 0
        break

      default:
        return null
    }

    return {
      layStake: Math.round(layStake * 100) / 100,
      liability: Math.round(liability * 100) / 100,
      backWinProfit: Math.round(backWinProfit * 100) / 100,
      layWinProfit: Math.round(layWinProfit * 100) / 100,
      qualifyingLoss: Math.round(qualifyingLoss * 100) / 100,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
      freeReturnValue: Math.round(freeReturnValue * 100) / 100
    }
  }, [betType, backStake, backOdds, layOdds, commission, validateInputs])

  const performCalculation = useCallback(async () => {
    if (!backStake || !backOdds || !layOdds) return

    setIsCalculating(true)
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const calculationResult = calculateMatchedBet()
    if (calculationResult) {
      setResult(calculationResult)
    }
    
    setIsCalculating(false)
  }, [calculateMatchedBet, backStake, backOdds, layOdds])

  const clearAll = () => {
    setBackStake("")
    setBackOdds("")
    setLayOdds("")
    setCommission("2")
    setBetType("qualifying")
    setResult(null)
    setErrors({})
  }

  // Auto-calculate when inputs change
  useEffect(() => {
    if (backStake && backOdds && layOdds && !Object.keys(errors).length) {
      const timeoutId = setTimeout(performCalculation, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [backStake, backOdds, layOdds, commission, betType, performCalculation, errors])

  const getResultColor = (value: number, isProfit: boolean = true) => {
    if (value === 0) return 'text-gray-600 dark:text-gray-400'
    if (isProfit) {
      return value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    } else {
      return value > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getBetTypeInfo = () => {
    return betTypes.find(bt => bt.id === betType)
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Matched Betting Calculator
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Calculate optimal lay stakes and profits for matched betting strategies
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bet Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bet Type</Label>
            <Select value={betType} onValueChange={setBetType}>
              <SelectTrigger className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {betTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.name}</span>
                      <span className="text-xs text-gray-500">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getBetTypeInfo() && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {getBetTypeInfo()?.description}
                </p>
              </div>
            )}
          </div>

          {/* Main Input/Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backStake" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Back Stake ($)
                  </Label>
                  <Input
                    id="backStake"
                    type="number"
                    value={backStake}
                    onChange={(e) => setBackStake(e.target.value)}
                    placeholder="100.00"
                    className={`h-12 text-base px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${
                      errors.backStake ? 'border-red-500' : ''
                    }`}
                    inputMode="decimal"
                  />
                  {errors.backStake && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.backStake}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exchange Commission (%)
                  </Label>
                  <Input
                    id="commission"
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="2.0"
                    step="0.1"
                    min="0"
                    max="10"
                    className={`h-12 text-base px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${
                      errors.commission ? 'border-red-500' : ''
                    }`}
                    inputMode="decimal"
                  />
                  {errors.commission && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.commission}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backOdds" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Back Odds (Bookmaker)
                  </Label>
                  <Input
                    id="backOdds"
                    type="number"
                    value={backOdds}
                    onChange={(e) => setBackOdds(e.target.value)}
                    placeholder="2.50"
                    step="0.01"
                    min="1.01"
                    className={`h-12 text-base px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${
                      errors.backOdds ? 'border-red-500' : ''
                    }`}
                    inputMode="decimal"
                  />
                  {errors.backOdds && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.backOdds}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layOdds" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lay Odds (Exchange)
                  </Label>
                  <Input
                    id="layOdds"
                    type="number"
                    value={layOdds}
                    onChange={(e) => setLayOdds(e.target.value)}
                    placeholder="2.60"
                    step="0.01"
                    min="1.01"
                    className={`h-12 text-base px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${
                      errors.layOdds ? 'border-red-500' : ''
                    }`}
                    inputMode="decimal"
                  />
                  {errors.layOdds && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.layOdds}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={clearAll}
                variant="outline"
                className="w-full min-h-[44px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              {isCalculating && (
                <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Calculating...</span>
                </div>
              )}

              {result && !isCalculating && (
                <div className="space-y-4">
                  {/* Key Results */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Lay Bet Required
                        </h3>
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Lay Stake:</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(result.layStake)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Liability:</span>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(result.liability)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profit/Loss Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">If Back Wins</div>
                        <div className={`text-xl font-bold ${getResultColor(result.backWinProfit)}`}>
                          {formatCurrency(result.backWinProfit)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">If Lay Wins</div>
                        <div className={`text-xl font-bold ${getResultColor(result.layWinProfit)}`}>
                          {formatCurrency(result.layWinProfit)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Result */}
                  {betType === "qualifying" ? (
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-orange-800 dark:text-orange-200 mb-1">Qualifying Loss</div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          -{formatCurrency(result.qualifyingLoss)}
                        </div>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                          Small loss to unlock bonus offers
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-green-800 dark:text-green-200 mb-1">Guaranteed Profit</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(result.guaranteedProfit)}
                        </div>
                        {result.freeReturnValue > 0 && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                            Free bet conversion: {((result.freeReturnValue / parseFloat(backStake)) * 100).toFixed(1)}%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips Section */}
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Matched Betting Tips
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Ensure you have sufficient exchange balance for the liability amount</li>
                        <li>• Check odds haven't moved before placing both bets</li>
                        <li>• Place the lay bet first if odds are moving in your favor</li>
                        <li>• Keep records of all bets for tax purposes</li>
                        {betType !== "qualifying" && (
                          <li>• Free bets typically convert 70-90% of their value to cash</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!result && !isCalculating && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calculator className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter your bet details to calculate matched betting profits
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* General Errors */}
          {errors.general && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              {errors.general}
            </div>
          )}

          {/* Educational Section */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Understanding Matched Betting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Concepts:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Back Bet:</strong> Betting FOR an outcome at a bookmaker</li>
                  <li>• <strong>Lay Bet:</strong> Betting AGAINST an outcome at an exchange</li>
                  <li>• <strong>Liability:</strong> Maximum you can lose on the lay bet</li>
                  <li>• <strong>Commission:</strong> Exchange fee on winnings</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Bet Types:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Qualifying:</strong> Small loss to unlock bonuses</li>
                  <li>• <strong>Free Bet SNR:</strong> Stake not returned with winnings</li>
                  <li>• <strong>Free Bet SR:</strong> Stake returned with winnings</li>
                  <li>• <strong>Risk-Free:</strong> Refund if initial bet loses</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}