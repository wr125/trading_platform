import { NextRequest, NextResponse } from 'next/server'
import { BACKTEST_TIMEFRAMES } from '@/lib/constants'

// Constants for backtesting
const TRANSACTION_FEE = 0.001 // 0.1% per trade
const SLIPPAGE = 0.001 // 0.1% slippage
const BACKTEST_START_DATE = '2023-01-01'
const BACKTEST_END_DATE = '2023-12-31'

export async function POST(request: NextRequest) {
  try {
    const { symbols, timeframe } = await request.json()

    if (!symbols || !timeframe) {
      return NextResponse.json(
        { error: 'Symbols and timeframe are required' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          // Fetch historical data from Alpaca
          const response = await fetch(
            `${process.env.ALPACA_API_URL}/stocks/${symbol}/bars?timeframe=${BACKTEST_TIMEFRAMES[timeframe]}&start=${BACKTEST_START_DATE}&end=${BACKTEST_END_DATE}`,
            {
              headers: {
                'APCA-API-KEY-ID': process.env.NEXT_PUBLIC_ALPACA_API_KEY!,
                'APCA-API-SECRET-KEY': process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY!,
              },
            }
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${symbol}`)
          }

          const data = await response.json()
          
          // Calculate backtest metrics
          let equity = 100000 // Starting with $100,000
          const trades = []
          const dailyReturns = []
          let maxDrawdown = 0
          let peak = equity

          for (const bar of data.bars) {
            const currentEquity = equity
            // Simple moving average strategy
            // Add your strategy logic here
            
            // Record daily return
            dailyReturns.push({
              date: bar.t,
              return: (currentEquity - equity) / equity
            })

            // Update max drawdown
            if (currentEquity > peak) {
              peak = currentEquity
            }
            const drawdown = (peak - currentEquity) / peak
            maxDrawdown = Math.max(maxDrawdown, drawdown)

            equity = currentEquity
          }

          // Calculate Sharpe Ratio
          const avgReturn = dailyReturns.reduce((sum, r) => sum + r.return, 0) / dailyReturns.length
          const stdDev = Math.sqrt(
            dailyReturns.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / dailyReturns.length
          )
          const sharpeRatio = avgReturn / stdDev * Math.sqrt(252) // Annualized

          return {
            symbol,
            finalEquity: equity,
            returns: ((equity - 100000) / 100000) * 100,
            totalTrades: trades.length,
            maxDrawdown,
            sharpeRatio,
            dailyReturns,
            trades
          }
        } catch (error) {
          console.error(`Error backtesting ${symbol}:`, error)
          return null
        }
      })
    )

    const validResults = results.filter(Boolean)

    return NextResponse.json({ results: validResults })
  } catch (error: any) {
    console.error('Backtest error:', error)
    return NextResponse.json(
      { error: 'Backtest failed', details: error.message },
      { status: 500 }
    )
  }
} 