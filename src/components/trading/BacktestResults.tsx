'use client'

import { useState } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar 
} from 'recharts'

interface Trade {
  date: string
  type: 'buy' | 'sell'
  shares: number
  price: number
  total: number
  fees: number
}

interface BacktestResult {
  symbol: string
  finalEquity: number
  returns: number
  totalTrades: number
  maxDrawdown: number
  sharpeRatio: number
  dailyReturns: Array<{ date: string; return: number }>
  trades: Trade[]
}

interface BacktestResultsProps {
  results: BacktestResult[]
  timeframe: string
  onTimeframeChange: (timeframe: 'H4' | 'DAILY' | 'MONTHLY') => void
}

export default function BacktestResults({ results, timeframe, onTimeframeChange }: BacktestResultsProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(results[0]?.symbol)
  const selectedResult = results.find(r => r.symbol === selectedSymbol)

  if (!selectedResult || results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No backtest results available</p>
      </div>
    )
  }

  const equityCurveData = selectedResult.dailyReturns?.map(dr => ({
    date: new Date(dr.date).toLocaleDateString(),
    equity: selectedResult.finalEquity * (1 + dr.return)
  })) || []

  const compareData = results.map(result => ({
    symbol: result?.symbol || 'Unknown',
    returns: Number(result?.returns || 0).toFixed(2),
    sharpeRatio: Number(result?.sharpeRatio || 0).toFixed(2),
    maxDrawdown: Number((result?.maxDrawdown || 0) * 100).toFixed(2)
  })).filter(data => data.symbol !== 'Unknown')

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Backtest Results</h2>
        <div className="flex gap-2">
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value as any)}
            className="px-3 py-1 border rounded"
          >
            <option value="H4">4 Hour</option>
            <option value="DAILY">Daily</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {results.map(r => (
              <option key={r.symbol} value={r.symbol}>{r.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Equity Curve - {selectedSymbol}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="equity" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Performance Comparison</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="returns" fill="#8884d8" name="Returns %" />
              <Bar dataKey="sharpeRatio" fill="#82ca9d" name="Sharpe Ratio" />
              <Bar dataKey="maxDrawdown" fill="#ff8042" name="Max Drawdown %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => {
          if (!result) return null
          
          return (
            <div key={result.symbol} className="border rounded p-4">
              <h3 className="font-medium">{result.symbol}</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p>Final Equity: ${Number(result.finalEquity || 0).toFixed(2)}</p>
                <p>Total Trades: {result.totalTrades || 0}</p>
                <p>Sharpe Ratio: {Number(result.sharpeRatio || 0).toFixed(2)}</p>
                <p>Max Drawdown: {Number((result.maxDrawdown || 0) * 100).toFixed(2)}%</p>
                <p>Win Rate: {result.trades?.length > 0 ? (
                  ((result.trades.filter(t => 
                    t.type === 'sell' && t.total > t.price * t.shares
                  ).length / result.trades.filter(t => t.type === 'sell').length) * 100).toFixed(2)
                ) : '0.00'}%</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 