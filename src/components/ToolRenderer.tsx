import React, { Suspense, lazy, type ComponentType } from 'react';

interface ToolProps {
  onError?: (error: string) => void;
}

// Tool registry with lazy loading - matches frontend exactly
const toolComponents: Record<string, () => Promise<{ default: ComponentType<ToolProps> }>> = {
  BlackjackStrategyCalculator: () => import('./tools/BlackjackStrategyCalculator'),
  MatchedBettingCalculator: () => import('./tools/MatchedBettingCalculator'),
  EachWayMatcher: () => import('./tools/EachWayMatcher'),
  '2UpCalculator': () => import('./tools/2UpCalculator'),
  TwoUpCalculator: () => import('./tools/2UpCalculator'), // Alias
  EarlyPayoutCalculator: () => import('./tools/EarlyPayoutCalculator'),
  ACCAMatchedBettingCalculator: () => import('./tools/ACCAMatchedBettingCalculator'),
  DutchingCalculator: () => import('./tools/DutchingCalculator'),
  LayBetCalculator: () => import('./tools/LayBetCalculator'),
  ArbitrageCalculator: () => import('./tools/ArbitrageCalculator'),
  KellyCriterionCalculator: () => import('./tools/KellyCriterionCalculator'),
  NFLMatchedBettingCalculator: () => import('./tools/NFLMatchedBettingCalculator'),
  FreeBetCalculator: () => import('./tools/FreeBetCalculator'),
  ExtraPlaceOffersBuilder: () => import('./tools/ExtraPlaceOffersBuilder'),
  CryptoArbitrageScanner: () => import('./tools/CryptoArbitrageScanner'),
};

interface ToolRendererProps {
  toolComponent: string;
  className?: string;
}

function ToolErrorFallback({ resetErrorBoundary }: { resetErrorBoundary?: () => void }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Tool Error</h3>
      <p className="text-red-600 dark:text-red-300 mb-4">Something went wrong loading this tool.</p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function ToolLoadingFallback() {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Loading tool...</p>
    </div>
  );
}

function JavaScriptRequiredFallback({ toolComponent }: { toolComponent: string }) {
  const getToolDescription = (toolName: string) => {
    const descriptions: Record<string, string> = {
      ArbitrageCalculator: "Calculate optimal stakes across multiple bookmakers to guarantee profit regardless of outcome. This tool helps you find arbitrage opportunities by analyzing odds from different bookmakers and calculating the perfect stake distribution.",
      MatchedBettingCalculator: "Calculate your matched betting profits and losses. This tool helps you determine the optimal stake for your qualifying bet and the corresponding lay bet to minimize risk.",
      BlackjackStrategyCalculator: "Get the optimal playing decision for any blackjack hand. This tool provides basic strategy recommendations based on your cards and the dealer's up card.",
      EachWayMatcher: "Calculate each-way matched betting opportunities. This tool helps you find value in each-way bets by comparing back and lay odds.",
      '2UpCalculator': "Calculate 2-up matched betting opportunities. This tool helps you identify profitable 2-up offers and calculate optimal stakes.",
      TwoUpCalculator: "Calculate 2-up matched betting opportunities. This tool helps you identify profitable 2-up offers and calculate optimal stakes.",
      EarlyPayoutCalculator: "Calculate early payout matched betting opportunities. This tool helps you determine if early payout offers are profitable.",
      ACCAMatchedBettingCalculator: "Calculate accumulator matched betting opportunities. This tool helps you find value in accumulator offers.",
      DutchingCalculator: "Calculate dutching stakes to guarantee profit. This tool helps you distribute stakes across multiple outcomes to ensure a profit regardless of the result.",
      LayBetCalculator: "Calculate lay betting stakes and liabilities. This tool helps you determine the optimal stake for lay bets on betting exchanges.",
      KellyCriterionCalculator: "Calculate optimal bet sizes using the Kelly Criterion. This tool helps you determine the ideal percentage of your bankroll to stake based on edge and odds.",
      NFLMatchedBettingCalculator: "Calculate NFL matched betting opportunities. This tool helps you find value in NFL betting offers.",
      FreeBetCalculator: "Calculate free bet value and optimal stakes. This tool helps you maximize the value of free bet offers.",
      ExtraPlaceOffersBuilder: "Build extra place offers for matched betting. This tool helps you identify profitable extra place opportunities.",
      CryptoArbitrageScanner: "Scan cryptocurrency arbitrage opportunities. This tool helps you find profitable price differences across crypto exchanges."
    };
    return descriptions[toolName] || "This is an interactive betting calculator tool that requires JavaScript to function properly.";
  };

  return (
    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="text-center mb-6">
        <div className="text-blue-600 dark:text-blue-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-2">
          JavaScript Required
        </h3>
        <p className="text-blue-600 dark:text-blue-300 mb-4">
          This interactive tool requires JavaScript to function properly.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
          About This Tool
        </h4>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {getToolDescription(toolComponent)}
        </p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            To Use This Tool:
          </h5>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Enable JavaScript in your browser</li>
            <li>• Refresh the page</li>
            <li>• The interactive calculator will load automatically</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            Tool Features:
          </h5>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Real-time calculations</li>
            <li>• Multiple calculation modes</li>
            <li>• Interactive form inputs</li>
            <li>• Detailed results and analysis</li>
            <li>• Educational content and tips</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// First ToolRenderer function removed - using the one below

// ToolRenderer component function
function ToolRendererComponent({ toolComponent, className = '' }: { toolComponent: string; className?: string }) {
  const loadTool = () => {
    const componentName = toolComponent;
    const componentLoader = toolComponents[componentName];
    
    if (!componentLoader) {
      console.error(`Tool component "${componentName}" not found`);
      return Promise.resolve({ default: ToolErrorFallback });
    }
    
    return componentLoader().catch((error) => {
      console.error(`Error loading tool component "${componentName}":`, error);
      return { default: ToolErrorFallback };
    });
  };

  const LazyTool = lazy(loadTool);

  return (
    <div className={className}>
      {/* JavaScript Required Fallback */}
      <noscript>
        <JavaScriptRequiredFallback toolComponent={toolComponent} />
      </noscript>

      {/* Interactive Tool (only loads with JavaScript) */}
      <div className="js-enabled">
        <Suspense fallback={<ToolLoadingFallback />}>
          <LazyTool />
        </Suspense>
      </div>
    </div>
  );
}

// Main ToolRenderer component
interface ToolRendererProps {
  toolName: string;
  className?: string;
}

export default function ToolRenderer({ toolName, className = '' }: ToolRendererProps) {
  return <ToolRendererComponent toolComponent={toolName} className={className} />;
}
