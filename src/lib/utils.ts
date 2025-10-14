// Utility functions

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format date for ISO string
export function formatDateISO(date: string | Date): string {
  return new Date(date).toISOString();
}

// Generate reading time estimate
export function getReadingTime(content: any): number {
  // Simple word count estimation
  const text = JSON.stringify(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Generate slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Calculate odds from probability
export function probabilityToOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) return 0;
  return 1 / probability;
}

// Calculate probability from odds
export function oddsToProbability(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

// Calculate implied probability
export function calculateImpliedProbability(odds: number): number {
  return oddsToProbability(odds);
}

// Calculate expected value
export function calculateExpectedValue(probability: number, odds: number, stake: number): number {
  const winAmount = stake * (odds - 1);
  const expectedValue = (probability * winAmount) - ((1 - probability) * stake);
  return expectedValue;
}

// Calculate Kelly Criterion
export function calculateKellyCriterion(probability: number, odds: number): number {
  const b = odds - 1; // net odds received on the wager
  const p = probability; // probability of winning
  const q = 1 - p; // probability of losing
  
  const kelly = (b * p - q) / b;
  return Math.max(0, kelly); // Kelly can't be negative
}

// Calculate arbitrage opportunity
export function calculateArbitrage(odds1: number, odds2: number): {
  isArbitrage: boolean;
  profit: number;
  stake1: number;
  stake2: number;
  totalStake: number;
} {
  const impliedProb1 = 1 / odds1;
  const impliedProb2 = 1 / odds2;
  const totalImpliedProb = impliedProb1 + impliedProb2;
  
  const isArbitrage = totalImpliedProb < 1;
  
  if (!isArbitrage) {
    return {
      isArbitrage: false,
      profit: 0,
      stake1: 0,
      stake2: 0,
      totalStake: 0
    };
  }
  
  const profit = 1 - totalImpliedProb;
  const stake1 = 1 / (1 + (odds1 / odds2));
  const stake2 = 1 / (1 + (odds2 / odds1));
  const totalStake = stake1 + stake2;
  
  return {
    isArbitrage: true,
    profit,
    stake1,
    stake2,
    totalStake
  };
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random string
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}