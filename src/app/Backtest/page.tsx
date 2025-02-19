'use client'

import { useState } from 'react'
import BacktestResults from '@/components/trading/BacktestResults'
import { BACKTEST_TIMEFRAMES } from '@/lib/constants'

export default function BacktestPage() {
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestResults, setBacktestResults] = useState<any[]>([])
  const [backtestTimeframe, setBacktestTimeframe] = useState<keyof typeof BACKTEST_TIMEFRAMES>('DAILY')
  const [selectedSymbols, setSelectedSymbols] = useState([
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'
  ])

  const startBacktest = async () => {
    try {
      setIsBacktesting(true)
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: selectedSymbols,
          timeframe: backtestTimeframe
        })
      })

      if (!response.ok) {
        throw new Error('Backtest failed')
      }

      const data = await response.json()
      setBacktestResults(data.results)
    } catch (error) {
      console.error('Error running backtest:', error)
    } finally {
      setIsBacktesting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Backtest Strategy</h1>
          <div className="flex items-center space-x-4">
            <select
              value={backtestTimeframe}
              onChange={(e) => setBacktestTimeframe(e.target.value as keyof typeof BACKTEST_TIMEFRAMES)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="H4">4 Hour</option>
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <button
              onClick={startBacktest}
              disabled={isBacktesting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isBacktesting ? 'Running...' : 'Run Backtest'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Selected Symbols</h2>
          <div className="flex flex-wrap gap-2">
            {selectedSymbols.map(symbol => (
              <div 
                key={symbol}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {symbol}
              </div>
            ))}
          </div>
        </div>

        {backtestResults.length > 0 && (
          <BacktestResults 
            results={backtestResults}
            timeframe={backtestTimeframe}
            onTimeframeChange={(tf) => {
              setBacktestTimeframe(tf)
              startBacktest()
            }}
          />
        )}
      </div>
    </div>
  )
} 