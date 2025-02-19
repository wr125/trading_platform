'use client'

import { useState, useEffect } from 'react'
import StockChart from '@/components/trading/StockChart'
import OrderBook from '@/components/trading/OrderBook'
import TradeForm from '@/components/trading/TradeForm'
import MarketOverview from '@/components/trading/MarketOverview'
import LongShortStrategy from '@/components/trading/LongShortStrategy'
import BacktestResults from '@/components/trading/BacktestResults'

// Initialize Alpaca client
let alpacaClient: any = null

const initAlpaca = async () => {
  if (!alpacaClient) {
    const AlpacaApi = await import('@alpacahq/alpaca-trade-api')
    alpacaClient = new AlpacaApi.default({
      keyId: process.env.NEXT_PUBLIC_ALPACA_API_KEY,
      secretKey: process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY,
      paper: true,
      baseUrl: 'https://paper-api.alpaca.markets'
    })
  }
  return alpacaClient
}

// Fetch stock data function
const fetchStockData = async (symbol: string, start: Date, end: Date) => {
  try {
    setIsLoading(true)
    setError(null)
    
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    
    console.log(`Fetching data for ${symbol} from ${startStr} to ${endStr}`)
    
    const response = await fetch(
      `/api/stocks/${symbol}?start=${startStr}&end=${endStr}`,
      {
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('API returned error:', data)
      throw new Error(data.error)
    }

    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid data format:', data)
      throw new Error('Invalid data format received')
    }

    setStockData(data.results)
  } catch (error: any) {
    console.error('Error fetching stock data:', error)
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}

// Add these constants for backtesting
const BACKTEST_START_DATE = '2023-01-01'
const BACKTEST_END_DATE = '2023-12-31'

// Add these types
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
  trades: Trade[]
  finalEquity: number
  returns: number
  totalTrades: number
  maxDrawdown: number
  sharpeRatio: number
  dailyReturns: { date: string; return: number }[]
}

// Add constants for backtesting
const BACKTEST_TIMEFRAMES = {
  H4: '4Hour',
  DAILY: '1Day',
  MONTHLY: '1Month'
} as const

const TRANSACTION_FEE = 0.001 // 0.1% per trade
const SLIPPAGE = 0.001 // 0.1% slippage

// Helper functions
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0)
  return sum / period
}

function calculateMaxDrawdown(equityCurve: number[]): number {
  let maxDrawdown = 0
  let peak = equityCurve[0]

  for (const equity of equityCurve) {
    if (equity > peak) {
      peak = equity
    }
    const drawdown = (peak - equity) / peak
    maxDrawdown = Math.max(maxDrawdown, drawdown)
  }

  return maxDrawdown
}

function calculateSharpeRatio(dailyReturns: number[]): number {
  const riskFreeRate = 0.02 // 2% annual risk-free rate
  const dailyRiskFree = Math.pow(1 + riskFreeRate, 1/252) - 1
  
  const excessReturns = dailyReturns.map(r => r - dailyRiskFree)
  const mean = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length
  const variance = excessReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / excessReturns.length
  const annualizedSharpe = Math.sqrt(252) * mean / Math.sqrt(variance)
  
  return annualizedSharpe
}

// Updated backtesting function
const runBacktest = async (symbols: string[], timeframe: keyof typeof BACKTEST_TIMEFRAMES) => {
  try {
    const client = await initAlpaca()
    const results: BacktestResult[] = []

    for (const symbol of symbols) {
      const bars = await client.getBarsV2(
        symbol,
        {
          start: BACKTEST_START_DATE,
          end: BACKTEST_END_DATE,
          timeframe: BACKTEST_TIMEFRAMES[timeframe],
          adjustment: 'all'
        }
      )

      const trades: Trade[] = []
      const prices: number[] = []
      const equityCurve: number[] = []
      const dailyReturns: { date: string; return: number }[] = []
      
      let position = 0
      let cash = 100000
      let equity = cash
      let prevEquity = cash

      for await (const bar of bars) {
        const currentPrice = bar.ClosePrice
        prices.push(currentPrice)

        if (prices.length >= 50) { // Wait for enough data for SMAs
          const sma20 = calculateSMA(prices, 20)
          const sma50 = calculateSMA(prices, 50)

          // Trading logic with transaction costs and slippage
          if (sma20 > sma50 && position <= 0) {
            const executionPrice = currentPrice * (1 + SLIPPAGE)
            const shares = Math.floor(cash / executionPrice)
            if (shares > 0) {
              const total = shares * executionPrice
              const fees = total * TRANSACTION_FEE
              
              position += shares
              cash -= (total + fees)
              
              trades.push({
                date: bar.Timestamp,
                type: 'buy',
                shares,
                price: executionPrice,
                total,
                fees
              })
            }
          } else if (sma20 < sma50 && position > 0) {
            const executionPrice = currentPrice * (1 - SLIPPAGE)
            const total = position * executionPrice
            const fees = total * TRANSACTION_FEE
            
            cash += (total - fees)
            trades.push({
              date: bar.Timestamp,
              type: 'sell',
              shares: position,
              price: executionPrice,
              total,
              fees
            })
            position = 0
          }
        }

        // Calculate equity and returns
        equity = cash + (position * currentPrice)
        equityCurve.push(equity)
        
        const dailyReturn = (equity - prevEquity) / prevEquity
        dailyReturns.push({
          date: bar.Timestamp,
          return: dailyReturn
        })
        prevEquity = equity
      }

      results.push({
        symbol,
        trades,
        finalEquity: equity,
        returns: (equity - 100000) / 100000 * 100,
        totalTrades: trades.length,
        maxDrawdown: calculateMaxDrawdown(equityCurve),
        sharpeRatio: calculateSharpeRatio(dailyReturns.map(r => r.return)),
        dailyReturns
      })
    }

    return results
  } catch (error) {
    console.error('Backtest error:', error)
    throw error
  }
}

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [stockData, setStockData] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [backtestResults, setBacktestResults] = useState<any[]>([])
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestTimeframe, setBacktestTimeframe] = useState<keyof typeof BACKTEST_TIMEFRAMES>('DAILY')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })
  const [error, setError] = useState<string | null>(null)

  const fetchStockData = async (symbol: string, start: Date, end: Date) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const startStr = start.toISOString()
      const endStr = end.toISOString()
      
      console.log(`Fetching data for ${symbol} from ${startStr} to ${endStr}`)
      
      const response = await fetch(
        `/api/stocks/${symbol}?start=${startStr}&end=${endStr}`,
        {
          cache: 'no-store'
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        console.error('API returned error:', data)
        throw new Error(data.error)
      }

      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid data format:', data)
        throw new Error('Invalid data format received')
      }

      setStockData(data.results)
    } catch (error: any) {
      console.error('Error fetching stock data:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData(selectedSymbol, dateRange.start, dateRange.end)
    fetchOrders()
  }, [selectedSymbol, dateRange])

  const fetchOrders = async () => {
    try {
      const client = await initAlpaca()
      const data = await client.getOrders({
        status: 'all',
        limit: 10
      })
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const startBacktest = async () => {
    try {
      setIsBacktesting(true)
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT']
      const results = await runBacktest(symbols, backtestTimeframe)
      setBacktestResults(results)
    } catch (error) {
      console.error('Error running backtest:', error)
    } finally {
      setIsBacktesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Market Overview */}
          <div className="col-span-12 lg:col-span-4">
            <MarketOverview />
          </div>

          {/* Long-Short Strategy */}
          <div className="col-span-12 lg:col-span-8">
            <LongShortStrategy />
          </div>

          {/* Main Chart */}
          <div className="col-span-12 lg:col-span-8">
            {error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="bg-white rounded-lg shadow p-4 h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <StockChart 
                symbol={selectedSymbol} 
                data={stockData}
                onDateRangeChange={(start, end) => setDateRange({ start, end })}
              />
            )}
          </div>

          {/* Order Book and Trading Form */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <OrderBook orders={orders} />
            <TradeForm 
              symbol={selectedSymbol}
              onSubmit={async (order) => {
                try {
                  const client = await initAlpaca()
                  await client.createOrder({
                    ...order,
                    type: 'market',
                    time_in_force: 'day'
                  })
                  fetchOrders()
                } catch (error) {
                  console.error('Error creating order:', error)
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 