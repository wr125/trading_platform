'use client'

import { useState, useEffect } from 'react'
import { restClient } from '@polygon.io/client-js'

interface TickerSnapshot {
  ticker: string
  todaysChange: number
  todaysChangePerc: number
  price: number
  volume: number
  prevDay: {
    c: number
    v: number
  }
}

export default function MarketAnalysis() {
  const [marketData, setMarketData] = useState<TickerSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState({
    key: 'todaysChangePerc',
    direction: 'desc'
  })

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/market/snapshot')
        if (!response.ok) {
          throw new Error('Failed to fetch market data')
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }

        setMarketData(data.results)
      } catch (error: any) {
        console.error('Error fetching market data:', error)
        setError('Failed to load market data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  const handleSort = (key: keyof TickerSnapshot) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }))

    setMarketData(prevData => {
      const sorted = [...prevData].sort((a, b) => {
        if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1
        if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
      return sorted
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Market Analysis</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ticker')}
                >
                  Ticker
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  Price
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('todaysChangePerc')}
                >
                  Change %
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('volume')}
                >
                  Volume
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Previous Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marketData.map((ticker) => (
                <tr key={ticker.ticker} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticker.ticker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${ticker.price.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    ticker.todaysChangePerc > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {ticker.todaysChangePerc.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticker.volume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${ticker.prevDay.c.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 