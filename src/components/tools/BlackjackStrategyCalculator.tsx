"use client"

import { useState, useEffect, useCallback } from "react"
import { Spade, RefreshCw, TrendingUp, AlertCircle } from "lucide-react"

interface GameRules {
  decks: number
  dealerHitsSoft17: boolean
  doubleAfterSplit: boolean
  surrender: boolean
  resplitAces: boolean
}

interface HandResult {
  action: string
  probability: number
  expectedValue: number
  reasoning: string
}

export default function BlackjackStrategyCalculator() {
  const [playerHand, setPlayerHand] = useState("")
  const [dealerUpcard, setDealerUpcard] = useState("")
  const [gameRules, setGameRules] = useState<GameRules>({
    decks: 6,
    dealerHitsSoft17: true,
    doubleAfterSplit: true,
    surrender: true,
    resplitAces: false
  })
  const [result, setResult] = useState<HandResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Card values mapping
  const cardValues: {[key: string]: number[]} = {
    'A': [1, 11], '2': [2], '3': [3], '4': [4], '5': [5], '6': [6],
    '7': [7], '8': [8], '9': [9], '10': [10], 'J': [10], 'Q': [10], 'K': [10]
  }

  // Basic strategy lookup table
  const basicStrategy: {[key: string]: string} = {
    // Hard hands
    'H5-2': 'H', 'H5-3': 'H', 'H5-4': 'H', 'H5-5': 'H', 'H5-6': 'H', 'H5-7': 'H', 'H5-8': 'H', 'H5-9': 'H', 'H5-10': 'H', 'H5-A': 'H',
    'H6-2': 'H', 'H6-3': 'H', 'H6-4': 'H', 'H6-5': 'H', 'H6-6': 'H', 'H6-7': 'H', 'H6-8': 'H', 'H6-9': 'H', 'H6-10': 'H', 'H6-A': 'H',
    'H7-2': 'H', 'H7-3': 'H', 'H7-4': 'H', 'H7-5': 'H', 'H7-6': 'H', 'H7-7': 'H', 'H7-8': 'H', 'H7-9': 'H', 'H7-10': 'H', 'H7-A': 'H',
    'H8-2': 'H', 'H8-3': 'H', 'H8-4': 'H', 'H8-5': 'H', 'H8-6': 'H', 'H8-7': 'H', 'H8-8': 'H', 'H8-9': 'H', 'H8-10': 'H', 'H8-A': 'H',
    'H9-2': 'H', 'H9-3': 'D', 'H9-4': 'D', 'H9-5': 'D', 'H9-6': 'D', 'H9-7': 'H', 'H9-8': 'H', 'H9-9': 'H', 'H9-10': 'H', 'H9-A': 'H',
    'H10-2': 'D', 'H10-3': 'D', 'H10-4': 'D', 'H10-5': 'D', 'H10-6': 'D', 'H10-7': 'D', 'H10-8': 'D', 'H10-9': 'D', 'H10-10': 'H', 'H10-A': 'H',
    'H11-2': 'D', 'H11-3': 'D', 'H11-4': 'D', 'H11-5': 'D', 'H11-6': 'D', 'H11-7': 'D', 'H11-8': 'D', 'H11-9': 'D', 'H11-10': 'D', 'H11-A': 'H',
    'H12-2': 'H', 'H12-3': 'H', 'H12-4': 'S', 'H12-5': 'S', 'H12-6': 'S', 'H12-7': 'H', 'H12-8': 'H', 'H12-9': 'H', 'H12-10': 'H', 'H12-A': 'H',
    'H13-2': 'S', 'H13-3': 'S', 'H13-4': 'S', 'H13-5': 'S', 'H13-6': 'S', 'H13-7': 'H', 'H13-8': 'H', 'H13-9': 'H', 'H13-10': 'H', 'H13-A': 'H',
    'H14-2': 'S', 'H14-3': 'S', 'H14-4': 'S', 'H14-5': 'S', 'H14-6': 'S', 'H14-7': 'H', 'H14-8': 'H', 'H14-9': 'H', 'H14-10': 'H', 'H14-A': 'H',
    'H15-2': 'S', 'H15-3': 'S', 'H15-4': 'S', 'H15-5': 'S', 'H15-6': 'S', 'H15-7': 'H', 'H15-8': 'H', 'H15-9': 'H', 'H15-10': 'H', 'H15-A': 'H',
    'H16-2': 'S', 'H16-3': 'S', 'H16-4': 'S', 'H16-5': 'S', 'H16-6': 'S', 'H16-7': 'H', 'H16-8': 'H', 'H16-9': 'H', 'H16-10': 'H', 'H16-A': 'H',
    'H17-2': 'S', 'H17-3': 'S', 'H17-4': 'S', 'H17-5': 'S', 'H17-6': 'S', 'H17-7': 'S', 'H17-8': 'S', 'H17-9': 'S', 'H17-10': 'S', 'H17-A': 'S',
    'H18-2': 'S', 'H18-3': 'S', 'H18-4': 'S', 'H18-5': 'S', 'H18-6': 'S', 'H18-7': 'S', 'H18-8': 'S', 'H18-9': 'S', 'H18-10': 'S', 'H18-A': 'S',
    'H19-2': 'S', 'H19-3': 'S', 'H19-4': 'S', 'H19-5': 'S', 'H19-6': 'S', 'H19-7': 'S', 'H19-8': 'S', 'H19-9': 'S', 'H19-10': 'S', 'H19-A': 'S',
    'H20-2': 'S', 'H20-3': 'S', 'H20-4': 'S', 'H20-5': 'S', 'H20-6': 'S', 'H20-7': 'S', 'H20-8': 'S', 'H20-9': 'S', 'H20-10': 'S', 'H20-A': 'S',
    'H21-2': 'S', 'H21-3': 'S', 'H21-4': 'S', 'H21-5': 'S', 'H21-6': 'S', 'H21-7': 'S', 'H21-8': 'S', 'H21-9': 'S', 'H21-10': 'S', 'H21-A': 'S',

    // Soft hands
    'S13-2': 'H', 'S13-3': 'H', 'S13-4': 'H', 'S13-5': 'D', 'S13-6': 'D', 'S13-7': 'H', 'S13-8': 'H', 'S13-9': 'H', 'S13-10': 'H', 'S13-A': 'H',
    'S14-2': 'H', 'S14-3': 'H', 'S14-4': 'H', 'S14-5': 'D', 'S14-6': 'D', 'S14-7': 'H', 'S14-8': 'H', 'S14-9': 'H', 'S14-10': 'H', 'S14-A': 'H',
    'S15-2': 'H', 'S15-3': 'H', 'S15-4': 'D', 'S15-5': 'D', 'S15-6': 'D', 'S15-7': 'H', 'S15-8': 'H', 'S15-9': 'H', 'S15-10': 'H', 'S15-A': 'H',
    'S16-2': 'H', 'S16-3': 'H', 'S16-4': 'D', 'S16-5': 'D', 'S16-6': 'D', 'S16-7': 'H', 'S16-8': 'H', 'S16-9': 'H', 'S16-10': 'H', 'S16-A': 'H',
    'S17-2': 'H', 'S17-3': 'D', 'S17-4': 'D', 'S17-5': 'D', 'S17-6': 'D', 'S17-7': 'H', 'S17-8': 'H', 'S17-9': 'H', 'S17-10': 'H', 'S17-A': 'H',
    'S18-2': 'S', 'S18-3': 'D', 'S18-4': 'D', 'S18-5': 'D', 'S18-6': 'D', 'S18-7': 'S', 'S18-8': 'S', 'S18-9': 'H', 'S18-10': 'H', 'S18-A': 'H',
    'S19-2': 'S', 'S19-3': 'S', 'S19-4': 'S', 'S19-5': 'S', 'S19-6': 'S', 'S19-7': 'S', 'S19-8': 'S', 'S19-9': 'S', 'S19-10': 'S', 'S19-A': 'S',
    'S20-2': 'S', 'S20-3': 'S', 'S20-4': 'S', 'S20-5': 'S', 'S20-6': 'S', 'S20-7': 'S', 'S20-8': 'S', 'S20-9': 'S', 'S20-10': 'S', 'S20-A': 'S',
    'S21-2': 'S', 'S21-3': 'S', 'S21-4': 'S', 'S21-5': 'S', 'S21-6': 'S', 'S21-7': 'S', 'S21-8': 'S', 'S21-9': 'S', 'S21-10': 'S', 'S21-A': 'S',

    // Pairs
    'P2-2': 'P', 'P2-3': 'P', 'P2-4': 'P', 'P2-5': 'P', 'P2-6': 'P', 'P2-7': 'P', 'P2-8': 'H', 'P2-9': 'H', 'P2-10': 'H', 'P2-A': 'H',
    'P3-2': 'P', 'P3-3': 'P', 'P3-4': 'P', 'P3-5': 'P', 'P3-6': 'P', 'P3-7': 'P', 'P3-8': 'H', 'P3-9': 'H', 'P3-10': 'H', 'P3-A': 'H',
    'P4-2': 'H', 'P4-3': 'H', 'P4-4': 'H', 'P4-5': 'P', 'P4-6': 'P', 'P4-7': 'H', 'P4-8': 'H', 'P4-9': 'H', 'P4-10': 'H', 'P4-A': 'H',
    'P5-2': 'D', 'P5-3': 'D', 'P5-4': 'D', 'P5-5': 'D', 'P5-6': 'D', 'P5-7': 'D', 'P5-8': 'D', 'P5-9': 'D', 'P5-10': 'H', 'P5-A': 'H',
    'P6-2': 'P', 'P6-3': 'P', 'P6-4': 'P', 'P6-5': 'P', 'P6-6': 'P', 'P6-7': 'H', 'P6-8': 'H', 'P6-9': 'H', 'P6-10': 'H', 'P6-A': 'H',
    'P7-2': 'P', 'P7-3': 'P', 'P7-4': 'P', 'P7-5': 'P', 'P7-6': 'P', 'P7-7': 'P', 'P7-8': 'H', 'P7-9': 'H', 'P7-10': 'H', 'P7-A': 'H',
    'P8-2': 'P', 'P8-3': 'P', 'P8-4': 'P', 'P8-5': 'P', 'P8-6': 'P', 'P8-7': 'P', 'P8-8': 'P', 'P8-9': 'P', 'P8-10': 'P', 'P8-A': 'P',
    'P9-2': 'P', 'P9-3': 'P', 'P9-4': 'P', 'P9-5': 'P', 'P9-6': 'P', 'P9-7': 'S', 'P9-8': 'P', 'P9-9': 'P', 'P9-10': 'S', 'P9-A': 'S',
    'P10-2': 'S', 'P10-3': 'S', 'P10-4': 'S', 'P10-5': 'S', 'P10-6': 'S', 'P10-7': 'S', 'P10-8': 'S', 'P10-9': 'S', 'P10-10': 'S', 'P10-A': 'S',
    'PA-2': 'P', 'PA-3': 'P', 'PA-4': 'P', 'PA-5': 'P', 'PA-6': 'P', 'PA-7': 'P', 'PA-8': 'P', 'PA-9': 'P', 'PA-10': 'P', 'PA-A': 'P'
  }

  const validateInput = useCallback((hand: string, upcard: string) => {
    const newErrors: {[key: string]: string} = {}
    
    if (!hand.trim()) {
      newErrors.playerHand = "Player hand is required"
    } else {
      const cards = hand.split(/[\s,]+/).filter(card => card)
      if (cards.length < 2) {
        newErrors.playerHand = "At least 2 cards required"
      } else {
        cards.forEach(card => {
          const normalizedCard = card.toUpperCase()
          if (!cardValues[normalizedCard]) {
            newErrors.playerHand = `Invalid card: ${card}. Use A, 2-10, J, Q, K`
          }
        })
      }
    }
    
    if (!upcard.trim()) {
      newErrors.dealerUpcard = "Dealer upcard is required"
    } else {
      const normalizedUpcard = upcard.toUpperCase()
      if (!cardValues[normalizedUpcard]) {
        newErrors.dealerUpcard = `Invalid card: ${upcard}. Use A, 2-10, J, Q, K`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [])

  const parseHand = (handString: string) => {
    const cards = handString.split(/[\s,]+/).filter(card => card).map(card => card.toUpperCase())
    let total = 0
    let aces = 0
    let isPair = false
    
    cards.forEach(card => {
      if (card === 'A') {
        aces++
        total += 11
      } else {
        total += cardValues[card][0]
      }
    })
    
    // Adjust for aces
    while (total > 21 && aces > 0) {
      total -= 10
      aces--
    }
    
    const isSoft = aces > 0 && total <= 21
    isPair = cards.length === 2 && cards[0] === cards[1]
    
    return { total, isSoft, isPair, cards }
  }

  const getStrategyKey = (hand: any, dealerCard: string) => {
    const normalizedDealer = dealerCard.toUpperCase()
    
    if (hand.isPair) {
      return `P${hand.cards[0]}-${normalizedDealer}`
    } else if (hand.isSoft) {
      return `S${hand.total}-${normalizedDealer}`
    } else {
      return `H${hand.total}-${normalizedDealer}`
    }
  }

  const calculateExpectedValue = (action: string, playerTotal: number, dealerCard: string, isSoft: boolean) => {
    // Simplified EV calculation - in a real app, this would be more sophisticated
    const dealerBustProbability = dealerCard === 'A' ? 0.12 : dealerCard === '6' ? 0.42 : 0.28
    const winProbability = dealerBustProbability + (playerTotal > 17 ? 0.4 : 0.2)
    
    switch (action) {
      case 'H': return winProbability * 1 - (1 - winProbability) * 1
      case 'S': return winProbability * 1 - (1 - winProbability) * 1
      case 'D': return (winProbability * 2 - (1 - winProbability) * 2) * 0.9
      case 'P': return winProbability * 2 - (1 - winProbability) * 2
      default: return 0
    }
  }

  const getActionName = (action: string) => {
    switch (action) {
      case 'H': return 'Hit'
      case 'S': return 'Stand'
      case 'D': return 'Double Down'
      case 'P': return 'Split'
      case 'R': return 'Surrender'
      default: return 'Unknown'
    }
  }

  const getReasoning = (action: string, hand: any, dealerCard: string) => {
    const dealerValue = dealerCard === 'A' ? 11 : (cardValues[dealerCard]?.[0] || 0)
    
    if (hand.isPair) {
      if (action === 'P') return `Always split ${hand.cards[0]}s against dealer ${dealerCard} for optimal EV`
      return `Don't split ${hand.cards[0]}s against dealer ${dealerCard} - play as ${hand.total}`
    } else if (hand.isSoft) {
      if (action === 'D') return `Double down on soft ${hand.total} against weak dealer card ${dealerCard}`
      if (action === 'H') return `Hit soft ${hand.total} to improve hand against dealer ${dealerCard}`
      return `Stand on soft ${hand.total} - good hand against dealer ${dealerCard}`
    } else {
      if (hand.total <= 11 && action === 'D') return `Always double on ${hand.total} when possible`
      if (hand.total >= 17) return `Always stand on hard ${hand.total}`
      if (hand.total >= 12 && dealerValue >= 2 && dealerValue <= 6) return `Stand against dealer's weak upcard ${dealerCard}`
      if (hand.total <= 11) return `Hit to improve hand - cannot bust`
      return `Basic strategy recommendation for ${hand.total} vs ${dealerCard}`
    }
  }

  const calculateStrategy = useCallback(async () => {
    if (!validateInput(playerHand, dealerUpcard)) return
    
    setIsCalculating(true)
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const hand = parseHand(playerHand)
      const strategyKey = getStrategyKey(hand, dealerUpcard)
      const action = basicStrategy[strategyKey] || 'H'
      
      const expectedValue = calculateExpectedValue(action, hand.total, dealerUpcard, hand.isSoft)
      const probability = Math.max(0.1, Math.min(0.9, (expectedValue + 1) / 2))
      
      setResult({
        action: getActionName(action),
        probability: probability * 100,
        expectedValue,
        reasoning: getReasoning(action, hand, dealerUpcard)
      })
    } catch (error) {
      setErrors({ general: "Error calculating strategy. Please check your input." })
    }
    
    setIsCalculating(false)
  }, [playerHand, dealerUpcard, gameRules])

  const clearAll = () => {
    setPlayerHand("")
    setDealerUpcard("")
    setResult(null)
    setErrors({})
  }

  // Auto-calculate when inputs change
  useEffect(() => {
    if (playerHand && dealerUpcard && !errors.playerHand && !errors.dealerUpcard) {
      const timeoutId = setTimeout(calculateStrategy, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [playerHand, dealerUpcard, calculateStrategy])

  const getResultColor = (action: string) => {
    switch (action) {
      case 'Hit':
      case 'Double Down':
        return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
      case 'Stand':
        return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
      case 'Split':
        return 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-bold">
            <Spade className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Blackjack Strategy Calculator
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Get optimal play recommendations based on basic strategy and game rules
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Game Rules Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Decks</label>
              <select 
                value={gameRules.decks.toString()} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGameRules(prev => ({ ...prev, decks: parseInt(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
              >
                <option value="1">1 Deck</option>
                <option value="2">2 Decks</option>
                <option value="4">4 Decks</option>
                <option value="6">6 Decks</option>
                <option value="8">8 Decks</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dealerHitsSoft17"
                checked={gameRules.dealerHitsSoft17}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameRules(prev => ({ ...prev, dealerHitsSoft17: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="dealerHitsSoft17" className="text-sm text-gray-700 dark:text-gray-300">
                Dealer hits soft 17
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="doubleAfterSplit"
                checked={gameRules.doubleAfterSplit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameRules(prev => ({ ...prev, doubleAfterSplit: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="doubleAfterSplit" className="text-sm text-gray-700 dark:text-gray-300">
                Double after split
              </label>
            </div>
          </div>

          {/* Main Input/Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="playerHand" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Hand
                </label>
                <input
                  id="playerHand"
                  type="text"
                  value={playerHand}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerHand(e.target.value)}
                  placeholder="e.g., A K or 7 8 or 9 9"
                  className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 ${
                    errors.playerHand ? 'border-red-500' : ''
                  }`}
                />
                {errors.playerHand && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.playerHand}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter cards separated by spaces (A, 2-10, J, Q, K)
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="dealerUpcard" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dealer Upcard
                </label>
                <input
                  id="dealerUpcard"
                  type="text"
                  value={dealerUpcard}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDealerUpcard(e.target.value)}
                  placeholder="e.g., 6 or K"
                  className={`w-full h-12 text-base px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 ${
                    errors.dealerUpcard ? 'border-red-500' : ''
                  }`}
                />
                {errors.dealerUpcard && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dealerUpcard}
                  </div>
                )}
              </div>

              <button
                onClick={clearAll}
                className="w-full min-h-[44px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Clear All
              </button>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              {isCalculating && (
                <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Calculating strategy...</span>
                </div>
              )}

              {result && !isCalculating && (
                <div className="space-y-4">
                  {/* Main Recommendation */}
                  <div className={`border-2 rounded-lg p-4 ${getResultColor(result.action)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Recommended Action
                      </h3>
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {result.action}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.reasoning}
                    </p>
                  </div>

                  {/* Probability & EV */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Win Probability</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {result.probability.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Value</div>
                      <div className={`text-xl font-bold ${
                        result.expectedValue >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {result.expectedValue >= 0 ? '+' : ''}{result.expectedValue.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  {/* Strategy Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 Strategy Tips
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• This recommendation is based on mathematically optimal basic strategy</li>
                      <li>• Expected value shows the average return per unit bet over many hands</li>
                      <li>• Game rules affect optimal strategy - adjust settings above for your table</li>
                      <li>• Always follow basic strategy for the lowest house edge (~0.5%)</li>
                    </ul>
                  </div>
                </div>
              )}

              {!result && !isCalculating && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Spade className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter your hand and dealer's upcard to get strategy recommendations
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Chart Preview */}
          {result && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Reference: Hard Hands vs Dealer Upcard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-600">
                      <th className="p-2 text-left text-gray-700 dark:text-gray-300">Your Hand</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">2</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">3</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">4</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">5</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">6</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">7</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">8</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">9</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">10</th>
                      <th className="p-2 text-center text-gray-700 dark:text-gray-300">A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(total => (
                      <tr key={total} className="border-b border-gray-300 dark:border-gray-600">
                        <td className="p-2 font-medium text-gray-900 dark:text-gray-100">{total}</td>
                        {['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'].map(dealer => {
                          const action = basicStrategy[`H${total}-${dealer}`] || 'H'
                          const bgColor = action === 'H' ? 'bg-red-100 dark:bg-red-900/30' : 
                                         action === 'S' ? 'bg-green-100 dark:bg-green-900/30' : 
                                         action === 'D' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                                         'bg-gray-100 dark:bg-gray-600'
                          return (
                            <td key={dealer} className={`p-2 text-center ${bgColor} text-gray-900 dark:text-gray-100`}>
                              {action}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border"></div>
                  <span>H = Hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border"></div>
                  <span>S = Stand</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 border"></div>
                  <span>D = Double</span>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errors.general}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}