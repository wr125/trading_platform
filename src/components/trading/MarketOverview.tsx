'use client'

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/contexts/WebSocketContext'

export default function MarketOverview() {
  const { subscribe, unsubscribe, marketData, isConnected } = useWebSocket()
  const symbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX']

  useEffect(() => {
    if (isConnected) {
      subscribe(symbols)
    }
    return () => {
      if (isConnected) {
        unsubscribe(symbols)
      }
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="bg-gray-50 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
        <div className="text-gray-500">
          Connecting to market data...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
      <div className="space-y-4">
        {symbols.map((symbol) => {
          const data = marketData[symbol]
          if (!data) return null

          return (
            <div key={symbol} className="flex justify-between items-center">
              <div className="font-medium">{symbol}</div>
              <div className="flex items-center space-x-4">
                <div>${data.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">
                  Vol: {data.size}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 