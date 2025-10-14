"use client"

import { useState, useEffect, useCallback } from "react"
import { Calculator, TrendingUp, Target, Gift, AlertTriangle, BarChart3, Copy, RefreshCw } from "lucide-react"

interface BetCalculation {
  backStake: number
  layStake: number
  layLiability: number
  backProfit: number
  layProfit: number
  totalProfit: number
  loss: number
  qualified: boolean
}

interface FreeBetResult {
  optimalLayOdds: number
  layStake: number
  layLiability: number
  profit: number
  conversionRate: number
}

interface EVResult {
  expectedValue: number
  probability: number
  potentialProfit: number
  potentialLoss: number
}

export default function NFLMatchedBettingCalculator() {
  // State for different calculator modes
  const [activeTab, setActiveTab] = useState<'basic' | 'freebet' | 'qualifier' | 'ev' | 'parlay'>('basic')
  
  // Basic Calculator State
  const [backStake, setBackStake] = useState<string>('')
  const [backOdds, setBackOdds] = useState<string>('')
  const [layOdds, setLayOdds] = useState<string>('')
  const [commission, setCommission] = useState<string>('2')
  const [oddsFormat, setOddsFormat] = useState<'decimal' | 'american'>('decimal')
  
  // Free Bet State
  const [freeBetAmount, setFreeBetAmount] = useState<string>('')
  const [freeBetBackOdds, setFreeBetBackOdds] = useState<string>('')
  const [freeBetLayOdds, setFreeBetLayOdds] = useState<string>('')
  const [conversionRate, setConversionRate] = useState<string>('80')
  
  // Qualifier State
  const [qualifierStake, setQualifierStake] = useState<string>('')
  const [qualifierBackOdds, setQualifierBackOdds] = useState<string>('')
  const [qualifierLayOdds, setQualifierLayOdds] = useState<string>('')
  const [requiredStake, setRequiredStake] = useState<string>('')
  
  // EV Calculator State
  const [evStake, setEvStake] = useState<string>('')
  const [evBackOdds, setEvBackOdds] = useState<string>('')
  const [winProbability, setWinProbability] = useState<string>('')
  const [refundType, setRefundType] = useState<'cash' | 'freebet'>('freebet')
  const [maxRefund, setMaxRefund] = useState<string>('')
  
  // Parlay State
  const [parlayLegs, setParlayLegs] = useState<Array<{id: number, odds: string}>>([
    {id: 1, odds: ''}, {id: 2, odds: ''}
  ])
  const [parlayStake, setParlayStake] = useState<string>('')
  const [parlayLayOdds, setParlayLayOdds] = useState<string>('')
  const [boostPercentage, setBoostPercentage] = useState<string>('0')
  
  // Results
  const [basicResult, setBasicResult] = useState<BetCalculation | null>(null)
  const [freeBetResult, setFreeBetResult] = useState<FreeBetResult | null>(null)
  const [qualifierResult, setQualifierResult] = useState<BetCalculation | null>(null)
  const [evResult, setEvResult] = useState<EVResult | null>(null)
  const [parlayResult, setParlayResult] = useState<BetCalculation | null>(null)
  
  // Utility Functions
  const convertAmericanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1
    } else {
      return (100 / Math.abs(american)) + 1
    }
  }
  
  const convertDecimalToAmerican = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100)
    } else {
      return Math.round(-100 / (decimal - 1))
    }
  }
  
  const parseOdds = (odds: string): number => {
    const num = parseFloat(odds)
    if (isNaN(num)) return 0
    
    if (oddsFormat === 'american') {
      return convertAmericanToDecimal(num)
    }
    return num
  }
  
  // Basic Calculator
  const calculateBasicBet = useCallback(() => {
    const stake = parseFloat(backStake)
    const bOdds = parseOdds(backOdds)
    const lOdds = parseOdds(layOdds)
    const comm = parseFloat(commission) / 100
    
    if (!stake || !bOdds || !lOdds || bOdds <= 1 || lOdds <= 1) {
      setBasicResult(null)
      return
    }
    
    const layStake = (stake * bOdds) / (lOdds - comm)
    const layLiability = layStake * (lOdds - 1)
    
    const backWinProfit = stake * (bOdds - 1) - layLiability
    const layWinProfit = layStake * (1 - comm) - stake
    
    const result: BetCalculation = {
      backStake: stake,
      layStake: Math.round(layStake * 100) / 100,
      layLiability: Math.round(layLiability * 100) / 100,
      backProfit: Math.round(backWinProfit * 100) / 100,
      layProfit: Math.round(layWinProfit * 100) / 100,
      totalProfit: Math.round(((backWinProfit + layWinProfit) / 2) * 100) / 100,
      loss: Math.round(Math.abs(backWinProfit - layWinProfit) * 100) / 100,
      qualified: true
    }
    
    setBasicResult(result)
  }, [backStake, backOdds, layOdds, commission, oddsFormat])
  
  // Free Bet Calculator
  const calculateFreeBet = useCallback(() => {
    const amount = parseFloat(freeBetAmount)
    const bOdds = parseOdds(freeBetBackOdds)
    const lOdds = parseOdds(freeBetLayOdds)
    const conversion = parseFloat(conversionRate) / 100
    const comm = parseFloat(commission) / 100
    
    if (!amount || !bOdds || !lOdds || bOdds <= 1 || lOdds <= 1) {
      setFreeBetResult(null)
      return
    }
    
    const layStake = (amount * (bOdds - 1)) / (lOdds - comm)
    const layLiability = layStake * (lOdds - 1)
    
    const profit = amount * (bOdds - 1) - layLiability
    
    const result: FreeBetResult = {
      optimalLayOdds: lOdds,
      layStake: Math.round(layStake * 100) / 100,
      layLiability: Math.round(layLiability * 100) / 100,
      profit: Math.round(profit * conversion * 100) / 100,
      conversionRate: conversion
    }
    
    setFreeBetResult(result)
  }, [freeBetAmount, freeBetBackOdds, freeBetLayOdds, conversionRate, commission])
  
  // Qualifier Calculator
  const calculateQualifier = useCallback(() => {
    const stake = parseFloat(qualifierStake)
    const bOdds = parseOdds(qualifierBackOdds)
    const lOdds = parseOdds(qualifierLayOdds)
    const required = parseFloat(requiredStake)
    const comm = parseFloat(commission) / 100
    
    if (!stake || !bOdds || !lOdds || bOdds <= 1 || lOdds <= 1) {
      setQualifierResult(null)
      return
    }
    
    const layStake = (stake * bOdds) / (lOdds - comm)
    const layLiability = layStake * (lOdds - 1)
    
    const backWinProfit = stake * (bOdds - 1) - layLiability
    const layWinProfit = layStake * (1 - comm) - stake
    
    const result: BetCalculation = {
      backStake: stake,
      layStake: Math.round(layStake * 100) / 100,
      layLiability: Math.round(layLiability * 100) / 100,
      backProfit: Math.round(backWinProfit * 100) / 100,
      layProfit: Math.round(layWinProfit * 100) / 100,
      totalProfit: Math.round(((backWinProfit + layWinProfit) / 2) * 100) / 100,
      loss: Math.round(Math.abs(backWinProfit - layWinProfit) * 100) / 100,
      qualified: required ? stake >= required : true
    }
    
    setQualifierResult(result)
  }, [qualifierStake, qualifierBackOdds, qualifierLayOdds, requiredStake, commission])
  
  // EV Calculator
  const calculateEV = useCallback(() => {
    const stake = parseFloat(evStake)
    const bOdds = parseOdds(evBackOdds)
    const probability = parseFloat(winProbability) / 100
    const maxRef = parseFloat(maxRefund)
    
    if (!stake || !bOdds || !probability || bOdds <= 1) {
      setEvResult(null)
      return
    }
    
    const winAmount = stake * (bOdds - 1)
    const refundAmount = refundType === 'cash' ? stake : stake * 0.8 // 80% free bet conversion
    const actualRefund = maxRef ? Math.min(refundAmount, maxRef) : refundAmount
    
    const expectedValue = (probability * winAmount) + ((1 - probability) * actualRefund) - stake
    
    const result: EVResult = {
      expectedValue: Math.round(expectedValue * 100) / 100,
      probability,
      potentialProfit: Math.round(winAmount * 100) / 100,
      potentialLoss: Math.round((stake - actualRefund) * 100) / 100
    }
    
    setEvResult(result)
  }, [evStake, evBackOdds, winProbability, refundType, maxRefund])
  
  // Parlay Calculator
  const calculateParlay = useCallback(() => {
    const stake = parseFloat(parlayStake)
    const lOdds = parseOdds(parlayLayOdds)
    const boost = parseFloat(boostPercentage) / 100
    const comm = parseFloat(commission) / 100
    
    if (!stake || !lOdds || lOdds <= 1) {
      setParlayResult(null)
      return
    }
    
    // Calculate combined parlay odds
    let combinedOdds = 1
    let validLegs = 0
    
    parlayLegs.forEach(leg => {
      const legOdds = parseOdds(leg.odds)
      if (legOdds > 1) {
        combinedOdds *= legOdds
        validLegs++
      }
    })
    
    if (validLegs < 2) {
      setParlayResult(null)
      return
    }
    
    // Apply boost
    const boostedOdds = combinedOdds * (1 + boost)
    
    const layStake = (stake * boostedOdds) / (lOdds - comm)
    const layLiability = layStake * (lOdds - 1)
    
    const backWinProfit = stake * (boostedOdds - 1) - layLiability
    const layWinProfit = layStake * (1 - comm) - stake
    
    const result: BetCalculation = {
      backStake: stake,
      layStake: Math.round(layStake * 100) / 100,
      layLiability: Math.round(layLiability * 100) / 100,
      backProfit: Math.round(backWinProfit * 100) / 100,
      layProfit: Math.round(layWinProfit * 100) / 100,
      totalProfit: Math.round(((backWinProfit + layWinProfit) / 2) * 100) / 100,
      loss: Math.round(Math.abs(backWinProfit - layWinProfit) * 100) / 100,
      qualified: true
    }
    
    setParlayResult(result)
  }, [parlayStake, parlayLayOdds, parlayLegs, boostPercentage, commission])
  
  // Auto-calculate with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'basic') calculateBasicBet()
      else if (activeTab === 'freebet') calculateFreeBet()
      else if (activeTab === 'qualifier') calculateQualifier()
      else if (activeTab === 'ev') calculateEV()
      else if (activeTab === 'parlay') calculateParlay()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [activeTab, calculateBasicBet, calculateFreeBet, calculateQualifier, calculateEV, calculateParlay])
  
  // Clear functions
  const clearAll = () => {
    setBackStake('')
    setBackOdds('')
    setLayOdds('')
    setFreeBetAmount('')
    setFreeBetBackOdds('')
    setFreeBetLayOdds('')
    setQualifierStake('')
    setQualifierBackOdds('')
    setQualifierLayOdds('')
    setRequiredStake('')
    setEvStake('')
    setEvBackOdds('')
    setWinProbability('')
    setMaxRefund('')
    setParlayStake('')
    setParlayLayOdds('')
    setBoostPercentage('0')
    setParlayLegs([{id: 1, odds: ''}, {id: 2, odds: ''}])
    setBasicResult(null)
    setFreeBetResult(null)
    setQualifierResult(null)
    setEvResult(null)
    setParlayResult(null)
  }
  
  // Add/Remove Parlay Legs
  const addParlayLeg = () => {
    setParlayLegs(prev => [...prev, {id: Date.now(), odds: ''}])
  }
  
  const removeParlayLeg = (id: number) => {
    setParlayLegs(prev => prev.filter(leg => leg.id !== id))
  }
  
  const updateParlayLeg = (id: number, odds: string) => {
    setParlayLegs(prev => prev.map(leg => leg.id === id ? {...leg, odds} : leg))
  }
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  // Copy bet slip
  const copyBetSlip = (result: BetCalculation, type: string) => {
    const slip = `NFL ${type} Bet Slip
Back Stake: ${formatCurrency(result.backStake)}
Lay Stake: ${formatCurrency(result.layStake)}
Lay Liability: ${formatCurrency(result.layLiability)}
Expected Profit: ${formatCurrency(result.totalProfit)}
Max Loss: ${formatCurrency(result.loss)}`
    
    navigator.clipboard.writeText(slip)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              NFL Matched Betting Calculator
            </h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'basic', label: 'Back & Lay', icon: Calculator },
              { id: 'freebet', label: 'Free Bet', icon: Gift },
              { id: 'qualifier', label: 'Qualifier', icon: Target },
              { id: 'ev', label: 'Expected Value', icon: TrendingUp },
              { id: 'parlay', label: 'Parlay', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Global Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Odds Format
              </label>
              <select
                value={oddsFormat}
                onChange={(e) => setOddsFormat(e.target.value as 'decimal' | 'american')}
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="decimal">Decimal (1.85)</option>
                <option value="american">American (+110)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exchange Commission (%)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="2"
                className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearAll}
                className="w-full min-h-[44px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
          
          {/* Basic Calculator */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Back Bet Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Stake ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={backStake}
                    onChange={(e) => setBackStake(e.target.value)}
                    placeholder="100"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={backOdds}
                    onChange={(e) => setBackOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '2.00' : '+100'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={layOdds}
                    onChange={(e) => setLayOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '2.05' : '+105'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              {basicResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Results</h3>
                    <button
                      onClick={() => copyBetSlip(basicResult, 'Basic')}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Slip
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lay Stake</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(basicResult.layStake)}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Lay Liability</div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(basicResult.layLiability)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${
                    basicResult.totalProfit >= 0 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className={`text-sm font-medium ${
                      basicResult.totalProfit >= 0 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      Expected Profit/Loss
                    </div>
                    <div className={`text-2xl font-bold ${
                      basicResult.totalProfit >= 0 
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {formatCurrency(basicResult.totalProfit)}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      Max variation: ±{formatCurrency((basicResult.loss || 0) / 2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Free Bet Calculator */}
          {activeTab === 'freebet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Free Bet Conversion</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Free Bet Amount ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={freeBetAmount}
                    onChange={(e) => setFreeBetAmount(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={freeBetBackOdds}
                    onChange={(e) => setFreeBetBackOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '3.00' : '+200'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={freeBetLayOdds}
                    onChange={(e) => setFreeBetLayOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '3.10' : '+210'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conversion Rate (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    placeholder="80"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              {freeBetResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Free Bet Results</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lay Stake</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(freeBetResult.layStake)}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Lay Liability</div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(freeBetResult.layLiability)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Expected Profit</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {formatCurrency(freeBetResult.profit)}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      At {(freeBetResult.conversionRate * 100).toFixed(0)}% conversion rate
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Qualifier Calculator */}
          {activeTab === 'qualifier' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Qualifier Bet</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Required Stake for Promo ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={requiredStake}
                    onChange={(e) => setRequiredStake(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Stake ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={qualifierStake}
                    onChange={(e) => setQualifierStake(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={qualifierBackOdds}
                    onChange={(e) => setQualifierBackOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '1.90' : '-110'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={qualifierLayOdds}
                    onChange={(e) => setQualifierLayOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '1.95' : '-105'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              {qualifierResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Qualifier Results</h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      qualifierResult.qualified 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {qualifierResult.qualified ? '✓ Qualified' : '✗ Not Qualified'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lay Stake</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(qualifierResult.layStake)}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Lay Liability</div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(qualifierResult.layLiability)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Expected Loss</div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {formatCurrency(Math.abs(qualifierResult.totalProfit))}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      Cost to qualify for promotion
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* EV Calculator */}
          {activeTab === 'ev' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Expected Value Calculator</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bet Stake ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={evStake}
                    onChange={(e) => setEvStake(e.target.value)}
                    placeholder="100"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={evBackOdds}
                    onChange={(e) => setEvBackOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '2.50' : '+150'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Win Probability (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={winProbability}
                    onChange={(e) => setWinProbability(e.target.value)}
                    placeholder="45"
                    min="0"
                    max="100"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Type
                  </label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as 'cash' | 'freebet')}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="freebet">Free Bet (80% value)</option>
                    <option value="cash">Cash Refund</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Refund ($) - Optional
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={maxRefund}
                    onChange={(e) => setMaxRefund(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              {evResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">EV Results</h3>
                  
                  <div className={`rounded-lg p-4 ${
                    evResult.expectedValue >= 0 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className={`text-sm font-medium ${
                      evResult.expectedValue >= 0 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      Expected Value
                    </div>
                    <div className={`text-3xl font-bold ${
                      evResult.expectedValue >= 0 
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {formatCurrency(evResult.expectedValue)}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      {evResult.expectedValue >= 0 ? 'Positive EV - Good bet!' : 'Negative EV - Avoid this bet'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Potential Profit</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(evResult.potentialProfit)}
                      </div>
                      <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                        If bet wins ({(evResult.probability * 100).toFixed(1)}% chance)
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Potential Loss</div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                        {formatCurrency(evResult.potentialLoss)}
                      </div>
                      <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                        If bet loses ({((1 - evResult.probability) * 100).toFixed(1)}% chance)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Parlay Calculator */}
          {activeTab === 'parlay' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Parlay Builder</h3>
                  <button
                    onClick={addParlayLeg}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Leg
                  </button>
                </div>
                
                <div className="space-y-3">
                  {parlayLegs.map((leg, index) => (
                    <div key={leg.id} className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Leg {index + 1} Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={leg.odds}
                          onChange={(e) => updateParlayLeg(leg.id, e.target.value)}
                          placeholder={oddsFormat === 'decimal' ? '1.90' : '-110'}
                          className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                      {parlayLegs.length > 2 && (
                        <button
                          onClick={() => removeParlayLeg(leg.id)}
                          className="self-end mb-0 h-12 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Odds Boost (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={boostPercentage}
                    onChange={(e) => setBoostPercentage(e.target.value)}
                    placeholder="0"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parlay Stake ($)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={parlayStake}
                    onChange={(e) => setParlayStake(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lay Odds ({oddsFormat === 'decimal' ? 'Decimal' : 'American'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={parlayLayOdds}
                    onChange={(e) => setParlayLayOdds(e.target.value)}
                    placeholder={oddsFormat === 'decimal' ? '3.50' : '+250'}
                    className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              {parlayResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Parlay Results</h3>
                    <button
                      onClick={() => copyBetSlip(parlayResult, 'Parlay')}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Slip
                    </button>
                  </div>
                  
                  {/* Show combined odds */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Combined Parlay Odds</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {(() => {
                        let combinedOdds = 1
                        parlayLegs.forEach(leg => {
                          const legOdds = parseOdds(leg.odds)
                          if (legOdds > 1) combinedOdds *= legOdds
                        })
                        const boosted = combinedOdds * (1 + parseFloat(boostPercentage) / 100)
                        return oddsFormat === 'decimal' 
                          ? boosted.toFixed(2) 
                          : (boosted >= 2 ? '+' : '') + convertDecimalToAmerican(boosted)
                      })()}
                    </div>
                    {parseFloat(boostPercentage) > 0 && (
                      <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                        With {boostPercentage}% boost applied
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lay Stake</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(parlayResult.layStake)}
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Lay Liability</div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                        {formatCurrency(parlayResult.layLiability)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${
                    parlayResult.totalProfit >= 0 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className={`text-sm font-medium ${
                      parlayResult.totalProfit >= 0 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      Expected Profit/Loss
                    </div>
                    <div className={`text-2xl font-bold ${
                      parlayResult.totalProfit >= 0 
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {formatCurrency(parlayResult.totalProfit)}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      Max variation: ±{formatCurrency((parlayResult.loss || 0) / 2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Warning Messages */}
          {(activeTab === 'basic' && basicResult?.loss && basicResult.loss > 2) ||
           (activeTab === 'qualifier' && qualifierResult?.loss && qualifierResult.loss > 2) ||
           (activeTab === 'parlay' && parlayResult?.loss && parlayResult.loss > 2) ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> Large variance detected. Consider finding closer odds for better matched betting.
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Educational Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tips for NFL Matched Betting</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Always check both teams' odds for better arbitrage opportunities</li>
              <li>• NFL games have good liquidity on major exchanges (Betfair, Smarkets)</li>
              <li>• Early payout offers are common - track team lead scenarios</li>
              <li>• Same-game parlays often have boosted odds, great for +EV bets</li>
              <li>• Consider live betting for better lay odds during games</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}