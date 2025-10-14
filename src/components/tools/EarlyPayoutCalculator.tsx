"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, TrendingUp, AlertTriangle, Target, RefreshCw, Download } from "lucide-react"

interface CalculationResults {
  layStake: number
  liability: number
  scenarios: {
    earlyPayoutWin: number
    earlyPayoutLose: number
    noPayoutWin: number
    noPayoutLose: number
  }
  normalModeProfit: number
  qualifyingLoss: number
}

interface OddsState {
  back: string
  lay: string
  backStake: string
  commission: string
}

export default function EarlyPayoutCalculator() {
  const [odds, setOdds] = useState<OddsState>({
    back: "",
    lay: "",
    backStake: "",
    commission: "2"
  })
  
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional" | "american">("decimal")
  const [sport, setSport] = useState<"football" | "tennis" | "nfl" | "basketball">("football")
  const [calculationMode, setCalculationMode] = useState<"normal" | "early-payout" | "partial">("normal")
  const [profitLockMode, setProfitLockMode] = useState<"lock" | "ride">("lock")
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCalculating, setIsCalculating] = useState(false)

  const sportConfigs = {
    football: { name: "Football (2 Goals Ahead)", trigger: "2-0 lead", icon: "⚽" },
    tennis: { name: "Tennis (1 Set + Retirement)", trigger: "1 set up + retirement", icon: "🎾" },
    nfl: { name: "NFL (17 Point Lead)", trigger: "17+ point lead", icon: "🏈" },
    basketball: { name: "Basketball (20 Point Lead)", trigger: "20+ point lead", icon: "🏀" }
  }

  const validateInputs = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    if (!odds.back || isNaN(parseFloat(odds.back)) || parseFloat(odds.back) <= 1) {
      newErrors.back = "Enter valid back odds (> 1.0)"
    }
    
    if (!odds.lay || isNaN(parseFloat(odds.lay)) || parseFloat(odds.lay) <= 1) {
      newErrors.lay = "Enter valid lay odds (> 1.0)"
    }
    
    if (!odds.backStake || isNaN(parseFloat(odds.backStake)) || parseFloat(odds.backStake) <= 0) {
      newErrors.backStake = "Enter valid stake amount"
    }
    
    if (isNaN(parseFloat(odds.commission)) || parseFloat(odds.commission) < 0 || parseFloat(odds.commission) > 10) {
      newErrors.commission = "Commission must be 0-10%"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [odds])

  const calculateResults = useCallback(() => {
    if (!validateInputs()) return

    setIsCalculating(true)
    
    setTimeout(() => {
      const backOdds = parseFloat(odds.back)
      const layOdds = parseFloat(odds.lay)
      const backStake = parseFloat(odds.backStake)
      const commission = parseFloat(odds.commission) / 100

      // Calculate lay stake for normal matched betting
      const layStake = (backStake * backOdds) / (layOdds - commission)
      const liability = layStake * (layOdds - 1)

      // Calculate profits for different scenarios
      const backProfit = backStake * (backOdds - 1)
      const layLoss = layStake * (layOdds - 1)
      const layProfit = layStake * (1 - commission)

      const scenarios = {
        // Early payout triggered + team wins (back bet wins + lay bet loses)
        earlyPayoutWin: backProfit - layLoss,
        
        // Early payout triggered + team loses/draws (back bet wins due to early payout + lay bet wins)
        earlyPayoutLose: backProfit + layProfit,
        
        // No early payout + team wins (back bet wins + lay bet loses)
        noPayoutWin: backProfit - layLoss,
        
        // No early payout + team loses (back bet loses + lay bet wins)
        noPayoutLose: -backStake + layProfit
      }

      const normalModeProfit = scenarios.noPayoutWin
      const qualifyingLoss = Math.abs(scenarios.noPayoutLose)

      setResults({
        layStake,
        liability,
        scenarios,
        normalModeProfit,
        qualifyingLoss
      })
      
      setIsCalculating(false)
    }, 300)
  }, [odds, validateInputs])

  useEffect(() => {
    if (odds.back && odds.lay && odds.backStake) {
      calculateResults()
    }
  }, [odds, calculateResults])

  const handleInputChange = (field: keyof OddsState, value: string) => {
    setOdds(prev => ({ ...prev, [field]: value }))
  }

  const clearAll = () => {
    setOdds({ back: "", lay: "", backStake: "", commission: "2" })
    setResults(null)
    setErrors({})
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getScenarioColor = (profit: number) => {
    if (profit > 0) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
    if (profit < 0) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
    return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Early Payout Calculator
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Calculate profits for matched betting with early payout promotions (2UP, 2 Goals Ahead, etc.)
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Sport Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sport & Promotion Type
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(sportConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSport(key as any)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                    sport === key
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <div className="text-lg mb-1">{config.icon}</div>
                  <div className="text-xs leading-tight">{config.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Input Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Betting Setup
              </h3>

              {/* Odds Format Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Odds Format
                </label>
                <div className="flex gap-2">
                  {(["decimal", "fractional", "american"] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setOddsFormat(format)}
                      className={`px-3 py-2 rounded-md text-sm capitalize ${
                        oddsFormat === format
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Back Odds */}
              <div className="space-y-2">
                <label htmlFor="back-odds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Back Odds (Bookmaker)
                </label>
                <input
                  id="back-odds"
                  type="text"
                  inputMode="decimal"
                  value={odds.back}
                  onChange={(e) => handleInputChange("back", e.target.value)}
                  className={`w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                    errors.back
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-gray-100`}
                  placeholder="e.g. 2.50"
                />
                {errors.back && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.back}
                  </p>
                )}
              </div>

              {/* Lay Odds */}
              <div className="space-y-2">
                <label htmlFor="lay-odds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lay Odds (Exchange)
                </label>
                <input
                  id="lay-odds"
                  type="text"
                  inputMode="decimal"
                  value={odds.lay}
                  onChange={(e) => handleInputChange("lay", e.target.value)}
                  className={`w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                    errors.lay
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-gray-100`}
                  placeholder="e.g. 2.55"
                />
                {errors.lay && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.lay}
                  </p>
                )}
              </div>

              {/* Back Stake */}
              <div className="space-y-2">
                <label htmlFor="back-stake" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Back Stake ($)
                </label>
                <input
                  id="back-stake"
                  type="text"
                  inputMode="decimal"
                  value={odds.backStake}
                  onChange={(e) => handleInputChange("backStake", e.target.value)}
                  className={`w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                    errors.backStake
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-gray-100`}
                  placeholder="e.g. 100"
                />
                {errors.backStake && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.backStake}
                  </p>
                )}
              </div>

              {/* Commission */}
              <div className="space-y-2">
                <label htmlFor="commission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exchange Commission (%)
                </label>
                <input
                  id="commission"
                  type="text"
                  inputMode="decimal"
                  value={odds.commission}
                  onChange={(e) => handleInputChange("commission", e.target.value)}
                  className={`w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors ${
                    errors.commission
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-gray-100`}
                  placeholder="e.g. 2"
                />
                {errors.commission && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.commission}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={clearAll}
                  className="flex-1 min-h-[44px] px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  className="flex-1 min-h-[44px] px-4 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                  disabled
                >
                  <Download className="w-4 h-4" />
                  Export Results
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                Calculation Results
                {isCalculating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                )}
              </h3>

              {results ? (
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lay Stake</div>
                      <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                        {formatCurrency(results.layStake)}
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Liability</div>
                      <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                        {formatCurrency(results.liability)}
                      </div>
                    </div>
                  </div>

                  {/* Scenario Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Profit/Loss Scenarios for {sportConfigs[sport].name}
                    </h4>
                    
                    <div className="space-y-2">
                      <div className={`p-4 rounded-lg border ${getScenarioColor(results.scenarios.earlyPayoutWin)}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">✅ Early Payout + Team Wins</div>
                            <div className="text-sm opacity-75">Payout triggered, back bet wins</div>
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(results.scenarios.earlyPayoutWin)}
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border ${getScenarioColor(results.scenarios.earlyPayoutLose)}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">🎯 Early Payout + Team Loses</div>
                            <div className="text-sm opacity-75">Best case: payout + lay wins</div>
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(results.scenarios.earlyPayoutLose)}
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border ${getScenarioColor(results.scenarios.noPayoutWin)}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">⚪ No Payout + Team Wins</div>
                            <div className="text-sm opacity-75">Normal matched bet result</div>
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(results.scenarios.noPayoutWin)}
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border ${getScenarioColor(results.scenarios.noPayoutLose)}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">❌ No Payout + Team Loses</div>
                            <div className="text-sm opacity-75">Qualifying loss scenario</div>
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(results.scenarios.noPayoutLose)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Recommendation */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Strategy Insight</h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p>• Maximum profit potential: <strong>{formatCurrency(Math.max(...Object.values(results.scenarios)))}</strong></p>
                      <p>• Worst case loss: <strong>{formatCurrency(Math.min(...Object.values(results.scenarios)))}</strong></p>
                      <p>• Early payout trigger: <strong>{sportConfigs[sport].trigger}</strong></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter your betting details to see profit calculations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}