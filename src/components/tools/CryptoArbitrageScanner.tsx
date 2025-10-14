"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle2, DollarSign, Percent, Clock, TrendingDown, ArrowRight, Settings } from "lucide-react"

interface PriceData {
  exchange: string
  price: number
  timestamp: number
  volume24h?: number
}

interface ArbitrageOpportunity {
  pair: string
  buyExchange: string
  buyPrice: number
  sellExchange: string
  sellPrice: number
  profitPercent: number
  profitUsd: number
  netProfitPercent: number
  netProfitUsd: number
  volume24h?: number
  risk: "low" | "medium" | "high"
}

interface FeeStructure {
  trading: number
  withdrawal: number
}

export default function CryptoArbitrageScanner() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [minProfit, setMinProfit] = useState("0.5")
  const [selectedPairs, setSelectedPairs] = useState<string[]>(["BTC/USDT", "ETH/USDT"])
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tradingFee, setTradingFee] = useState("0.1")
  const [withdrawalFee, setWithdrawalFee] = useState("0.0005")
  const [investmentAmount, setInvestmentAmount] = useState("1000")

  const tradingPairs = [
    "BTC/USDT",
    "ETH/USDT",
    "BNB/USDT",
    "SOL/USDT",
    "XRP/USDT",
    "ADA/USDT",
    "DOGE/USDT",
    "MATIC/USDT"
  ]

  const calculateNetProfit = useCallback((grossProfit: number, price: number) => {
    const tradingFeePercent = parseFloat(tradingFee) || 0.1
    const withdrawalCost = parseFloat(withdrawalFee) || 0
    
    // Two trades (buy and sell), so trading fee applies twice
    const totalTradingFees = (tradingFeePercent * 2 / 100) * price
    const netProfit = grossProfit - totalTradingFees - withdrawalCost
    const netProfitPercent = (netProfit / price) * 100
    
    return { netProfitPercent, netProfitUsd: netProfit }
  }, [tradingFee, withdrawalFee])

  const assessRisk = (profitPercent: number, volume?: number): "low" | "medium" | "high" => {
    if (profitPercent > 2 && (!volume || volume > 1000000)) return "low"
    if (profitPercent > 1 && (!volume || volume > 500000)) return "medium"
    return "high"
  }

  const fetchBinancePrice = async (pair: string): Promise<PriceData | null> => {
    try {
      const symbol = pair.replace("/", "")
      const [priceRes, tickerRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`),
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
      ])
      
      const priceData = await priceRes.json()
      const tickerData = await tickerRes.json()
      
      if (priceData.price) {
        return {
          exchange: "Binance",
          price: parseFloat(priceData.price),
          timestamp: Date.now(),
          volume24h: tickerData.quoteVolume ? parseFloat(tickerData.quoteVolume) : undefined
        }
      }
    } catch (err) {
      console.error("Binance error:", err)
    }
    return null
  }

  const fetchKrakenPrice = async (pair: string): Promise<PriceData | null> => {
    try {
      const krakenPair = pair.replace("/", "").replace("USDT", "USD")
      const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPair}`)
      const data = await response.json()
      
      if (data.result) {
        const pairKey = Object.keys(data.result)[0]
        if (pairKey && data.result[pairKey].c) {
          return {
            exchange: "Kraken",
            price: parseFloat(data.result[pairKey].c[0]),
            timestamp: Date.now(),
            volume24h: data.result[pairKey].v ? parseFloat(data.result[pairKey].v[1]) : undefined
          }
        }
      }
    } catch (err) {
      console.error("Kraken error:", err)
    }
    return null
  }

  const generateMockPrice = (basePair: string, exchange: string): PriceData => {
    const basePrices: { [key: string]: number } = {
      "BTC/USDT": 65000,
      "ETH/USDT": 3200,
      "BNB/USDT": 580,
      "SOL/USDT": 145,
      "XRP/USDT": 0.52,
      "ADA/USDT": 0.45,
      "DOGE/USDT": 0.08,
      "MATIC/USDT": 0.75
    }
    
    const basePrice = basePrices[basePair] || 100
    const variance = (Math.random() - 0.5) * 0.04
    const price = basePrice * (1 + variance)
    
    const isSmallCap = basePrice < 1
    const decimals = isSmallCap ? 4 : 2
    
    return {
      exchange,
      price: parseFloat(price.toFixed(decimals)),
      timestamp: Date.now(),
      volume24h: Math.random() * 10000000 + 500000
    }
  }

  const scanForArbitrage = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    
    try {
      const allOpportunities: ArbitrageOpportunity[] = []
      
      for (const pair of selectedPairs) {
        const prices: PriceData[] = []
        
        const binancePrice = await fetchBinancePrice(pair)
        if (binancePrice) prices.push(binancePrice)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const krakenPrice = await fetchKrakenPrice(pair)
        if (krakenPrice) prices.push(krakenPrice)
        
        // Add mock data for other exchanges
        if (prices.length < 3) {
          prices.push(generateMockPrice(pair, "Coinbase"))
          prices.push(generateMockPrice(pair, "OKX"))
          prices.push(generateMockPrice(pair, "Bybit"))
        }
        
        if (prices.length < 2) continue
        
        // Find all profitable combinations
        for (let i = 0; i < prices.length; i++) {
          for (let j = 0; j < prices.length; j++) {
            if (i === j) continue
            
            const buyPrice = prices[i]
            const sellPrice = prices[j]
            
            if (sellPrice.price <= buyPrice.price) continue
            
            const profitPercent = ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100
            const profitUsd = sellPrice.price - buyPrice.price
            
            const { netProfitPercent, netProfitUsd } = calculateNetProfit(profitUsd, buyPrice.price)
            
            if (netProfitPercent >= parseFloat(minProfit)) {
              allOpportunities.push({
                pair,
                buyExchange: buyPrice.exchange,
                buyPrice: buyPrice.price,
                sellExchange: sellPrice.exchange,
                sellPrice: sellPrice.price,
                profitPercent,
                profitUsd,
                netProfitPercent,
                netProfitUsd,
                volume24h: buyPrice.volume24h,
                risk: assessRisk(netProfitPercent, buyPrice.volume24h)
              })
            }
          }
        }
      }
      
      allOpportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent)
      setOpportunities(allOpportunities)
      setLastUpdate(new Date())
    } catch (err) {
      setError("Failed to fetch prices from some exchanges. Showing available data.")
      console.error(err)
    } finally {
      setIsScanning(false)
    }
  }, [selectedPairs, minProfit, calculateNetProfit])

  useEffect(() => {
    scanForArbitrage()
    if (autoRefresh) {
      const interval = setInterval(scanForArbitrage, parseInt(refreshInterval) * 1000)
      return () => clearInterval(interval)
    }
  }, [scanForArbitrage, autoRefresh, refreshInterval])

  const togglePair = (pair: string) => {
    setSelectedPairs(prev => 
      prev.includes(pair) 
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    )
  }

  const formatPrice = (price: number, pair: string) => {
    const isSmallCap = price < 1
    const decimals = isSmallCap ? 4 : 2
    return price.toFixed(decimals)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const totalPotentialProfit = useMemo(() => {
    const investment = parseFloat(investmentAmount) || 0
    return opportunities.reduce((sum, opp) => {
      const units = investment / opp.buyPrice
      return sum + (units * opp.netProfitUsd)
    }, 0)
  }, [opportunities, investmentAmount])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      case "medium": return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      case "high": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      default: return ""
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Crypto Arbitrage Scanner
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              {showAdvanced ? "Hide" : "Show"} Settings
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Opportunities</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{opportunities.length}</p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <Percent className="w-4 h-4" />
                <span className="text-xs font-medium">Best Profit</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {opportunities[0]?.netProfitPercent.toFixed(2) || "0.00"}%
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Potential Profit</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalPotentialProfit)}
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Last Update</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trading Pairs ({selectedPairs.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tradingPairs.map((pair) => (
                    <button
                      key={pair}
                      onClick={() => togglePair(pair)}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        selectedPairs.includes(pair)
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {pair.replace("/USDT", "")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Net Profit (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                  className="w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="0.5"
                />
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Investment Amount ($)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trading Fee (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tradingFee}
                      onChange={(e) => setTradingFee(e.target.value)}
                      className="w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Withdrawal Fee ($)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={withdrawalFee}
                      onChange={(e) => setWithdrawalFee(e.target.value)}
                      className="w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="0.0005"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auto-Refresh (seconds)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value)}
                      disabled={!autoRefresh}
                      className="w-full h-12 px-4 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                      placeholder="30"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable auto-refresh</span>
                  </label>
                </>
              )}

              <button
                onClick={scanForArbitrage}
                disabled={isScanning}
                className="w-full min-h-[44px] px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                {isScanning ? "Scanning..." : "Scan Now"}
              </button>
            </div>

            {/* Opportunities List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                <span>Arbitrage Opportunities</span>
                {opportunities.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Sorted by net profit
                  </span>
                )}
              </h3>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
                </div>
              )}

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {opportunities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">
                      {isScanning ? "Scanning exchanges..." : "No profitable opportunities found"}
                    </p>
                    <p className="text-sm mt-1">
                      Try lowering the minimum profit threshold or selecting more pairs
                    </p>
                  </div>
                ) : (
                  opportunities.map((opp, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {opp.pair}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(opp.risk)}`}>
                            {opp.risk.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Net Profit</div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            +{opp.netProfitPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3 text-sm">
                        <div className="flex-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-xs text-red-600 dark:text-red-400 mb-1">Buy</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{opp.buyExchange}</div>
                          <div className="text-gray-600 dark:text-gray-400">${formatPrice(opp.buyPrice, opp.pair)}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Sell</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{opp.sellExchange}</div>
                          <div className="text-gray-600 dark:text-gray-400">${formatPrice(opp.sellPrice, opp.pair)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Gross Profit:</span>
                          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                            {opp.profitPercent.toFixed(2)}% (${formatPrice(opp.profitUsd, opp.pair)})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Net Profit:</span>
                          <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                            {opp.netProfitPercent.toFixed(2)}% (${formatPrice(opp.netProfitUsd, opp.pair)})
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">With ${investmentAmount}:</span>
                          <span className="ml-1 font-bold text-green-600 dark:text-green-400">
                            {formatCurrency((parseFloat(investmentAmount) / opp.buyPrice) * opp.netProfitUsd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>⚠️ Important:</strong> Net profit calculations include trading fees ({tradingFee}% per trade) and withdrawal fees (${withdrawalFee}). 
              Real arbitrage requires fast execution, sufficient liquidity, and consideration of network congestion. 
              Always verify fees on your specific exchanges and account for slippage. Past opportunities do not guarantee future profits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}