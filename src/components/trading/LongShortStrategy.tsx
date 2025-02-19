'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for Alpaca with no SSR
const AlpacaClient = dynamic(
  () => import('@alpacahq/alpaca-trade-api').then(mod => mod.default),
  { ssr: false }
)

interface Stock {
  name: string
  pc: number
}

class LongShort {
  private alpaca: any
  private allStocks: Stock[]
  private long: string[]
  private short: string[]
  private qShort: number | null
  private qLong: number | null
  private blacklist: Set<string>
  private longAmount: number
  private shortAmount: number
  private timeToClose: number | null
  private onStatusUpdate: (status: string) => void
  private onPositionsUpdate: (positions: any[]) => void
  private isInitialized: boolean
  private lastCheck: number = 0
  private checkInterval: NodeJS.Timeout | null = null

  constructor(onStatusUpdate: (status: string) => void, onPositionsUpdate: (positions: any[]) => void) {
    this.onStatusUpdate = onStatusUpdate
    this.onPositionsUpdate = onPositionsUpdate
    this.isInitialized = false

    // Initial stock universe
    const stockList = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT']
    this.allStocks = stockList.map(stock => ({ name: stock, pc: 0 }))
    
    this.long = []
    this.short = []
    this.qShort = null
    this.qLong = null
    this.blacklist = new Set()
    this.longAmount = 0
    this.shortAmount = 0
    this.timeToClose = null
  }

  async initialize() {
    try {
      const AlpacaApi = await import('@alpacahq/alpaca-trade-api')
      this.alpaca = new AlpacaApi.default({
        keyId: process.env.NEXT_PUBLIC_ALPACA_API_KEY,
        secretKey: process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      })
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Error initializing Alpaca:', error)
      this.onStatusUpdate(`Error initializing: ${error.message}`)
      return false
    }
  }

  async run() {
    try {
      this.onStatusUpdate('Initializing...')
      const initialized = await this.initialize()
      if (!initialized) return

      this.onStatusUpdate('Checking market status...')
      
      try {
        // Check if we can trade
        const clock = await this.alpaca.getClock()
        if (!clock.is_open) {
          const nextOpen = new Date(clock.next_open)
          const now = new Date()
          const timeToOpen = nextOpen.getTime() - now.getTime()
          
          // Convert milliseconds to hours and minutes
          const hours = Math.floor(timeToOpen / (1000 * 60 * 60))
          const minutes = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60))
          
          // Create time string
          const timeString = hours > 0 
            ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
            : `${minutes} minute${minutes !== 1 ? 's' : ''}`
          
          this.onStatusUpdate(`Market is closed. Opens in ${timeString}`)
          
          // Schedule next run when market opens
          setTimeout(() => this.run(), timeToOpen)
          return
        }
      } catch (error) {
        if (error.message?.includes('subscription does not permit')) {
          this.onStatusUpdate('Using paper trading mode - limited data access')
          // Continue with limited functionality
        } else {
          throw error
        }
      }

      // Modify the strategy to work with available data
      await this.runLimitedStrategy()
    } catch (error) {
      this.onStatusUpdate(`Error: ${error.message}`)
      console.error('Strategy error:', error)
    }
  }

  private async runLimitedStrategy() {
    try {
      // Get basic stock data that's available with paper trading
      const positions = await this.alpaca.getPositions()
      this.onPositionsUpdate(positions)

      // Set up basic monitoring
      this.startTradingCycle()
      this.onStatusUpdate('Trading cycle started')
    } catch (error) {
      console.error('Limited strategy error:', error)
      this.onStatusUpdate(`Strategy error: ${error.message}`)
    }
  }

  private async cancelAllOrders() {
    try {
      const orders = await this.alpaca.getOrders({
        status: 'open',
        direction: 'desc'
      })
      
      await Promise.all(orders.map(order => this.alpaca.cancelOrder(order.id)))
    } catch (error) {
      console.error('Error canceling orders:', error)
      throw error
    }
  }

  private async updatePositions() {
    try {
      const positions = await this.alpaca.getPositions()
      this.onPositionsUpdate(positions)
    } catch (error) {
      console.error('Error updating positions:', error)
    }
  }

  private startTradingCycle() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(async () => {
      try {
        // Rate limit checks to once per minute
        const now = Date.now()
        if (now - this.lastCheck < 60000) return
        this.lastCheck = now

        // Update positions
        await this.updatePositions()
        
        // Basic rebalancing if needed
        if (this.timeToClose === null || this.timeToClose > (60000 * 15)) {
          this.onStatusUpdate('Checking positions...')
          await this.rebalance()
        }
      } catch (error) {
        if (!error.message?.includes('subscription does not permit')) {
          this.onStatusUpdate(`Error: ${error.message}`)
          console.error('Trading cycle error:', error)
        }
      }
    }, 60000) // Check every minute
  }

  private async closeAllPositions() {
    const positions = await this.alpaca.getPositions()
    await Promise.all(positions.map(position => {
      const side = position.side === 'long' ? 'sell' : 'buy'
      const qty = Math.abs(position.qty)
      return this.submitOrder(qty, position.symbol, side)
    }))
  }

  private async rebalance() {
    await this.rerank()

    // Clear existing orders
    const orders = await this.alpaca.getOrders({ status: 'open', direction: 'desc' })
    await Promise.all(orders.map(order => this.alpaca.cancelOrder(order.id)))

    console.log("Long positions:", this.long.join(', '))
    console.log("Short positions:", this.short.join(', '))

    // Get current positions
    const positions = await this.alpaca.getPositions()
    const executed = { long: [], short: [] }
    this.blacklist.clear()

    // Adjust existing positions
    await Promise.all(positions.map(async position => {
      if (!this.long.includes(position.symbol) && !this.short.includes(position.symbol)) {
        // Position not in either list - clear it
        const side = position.side === "long" ? "sell" : "buy"
        await this.submitOrder(Math.abs(position.qty), position.symbol, side)
      } else if (this.long.includes(position.symbol)) {
        // Handle long position
        if (position.side === "short") {
          await this.submitOrder(Math.abs(position.qty), position.symbol, "buy")
        } else {
          if (position.qty !== this.qLong) {
            const diff = Number(position.qty) - Number(this.qLong)
            const side = diff > 0 ? "sell" : "buy"
            await this.submitOrder(Math.abs(diff), position.symbol, side)
          }
          executed.long.push(position.symbol)
          this.blacklist.add(position.symbol)
        }
      } else if (this.short.includes(position.symbol)) {
        // Handle short position
        if (position.side === "long") {
          await this.submitOrder(position.qty, position.symbol, "sell")
        } else {
          if (Math.abs(position.qty) !== this.qShort) {
            const diff = Math.abs(position.qty) - Number(this.qShort)
            const side = diff > 0 ? "buy" : "sell"
            await this.submitOrder(Math.abs(diff), position.symbol, side)
          }
          executed.short.push(position.symbol)
          this.blacklist.add(position.symbol)
        }
      }
    }))

    // Submit batch orders for remaining positions
    const [longIncomplete, longExecuted] = await this.sendBatchOrder(this.qLong!, this.long, 'buy')
    const [shortIncomplete, shortExecuted] = await this.sendBatchOrder(this.qShort!, this.short, 'sell')

    // Handle any failed orders by adjusting quantities
    if (longIncomplete.length > 0 && longExecuted.length > 0) {
      const prices = await this.getTotalPrice(longExecuted)
      const total = prices.reduce((a, b) => a + b, 0)
      if (total > 0) {
        const adjustedQLong = Math.floor(this.longAmount / total)
        const qLongDiff = adjustedQLong - this.qLong!
        await Promise.all(longExecuted.map(stock => 
          this.submitOrder(qLongDiff, stock, 'buy')
        ))
      }
    }

    if (shortIncomplete.length > 0 && shortExecuted.length > 0) {
      const prices = await this.getTotalPrice(shortExecuted)
      const total = prices.reduce((a, b) => a + b, 0)
      if (total > 0) {
        const adjustedQShort = Math.floor(this.shortAmount / total)
        const qShortDiff = adjustedQShort - this.qShort!
        await Promise.all(shortExecuted.map(stock => 
          this.submitOrder(qShortDiff, stock, 'sell')
        ))
      }
    }
  }

  private async rerank() {
    await this.rank()

    // Select top and bottom quarter for long/short
    const quarterSize = Math.floor(this.allStocks.length / 4)
    this.short = this.allStocks.slice(0, quarterSize).map(s => s.name)
    this.long = this.allStocks.slice(-quarterSize).map(s => s.name)

    // Calculate position sizes
    const account = await this.alpaca.getAccount()
    const equity = Number(account.equity)
    this.shortAmount = 0.30 * equity
    this.longAmount = this.shortAmount + equity

    const longPrices = await this.getTotalPrice(this.long)
    const shortPrices = await this.getTotalPrice(this.short)

    const longTotal = longPrices.reduce((a, b) => a + b, 0)
    const shortTotal = shortPrices.reduce((a, b) => a + b, 0)

    this.qLong = Math.floor(this.longAmount / longTotal)
    this.qShort = Math.floor(this.shortAmount / shortTotal)
  }

  private async rank() {
    // Get percent changes for ranking
    await Promise.all(this.allStocks.map(async stock => {
      const bars = await this.alpaca.getBarsV2(
        stock.name,
        {
          start: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          timeframe: '1Min'
        }
      )
      
      let first = null
      let last = null
      for await (const bar of bars) {
        if (!first) first = bar.ClosePrice
        last = bar.ClosePrice
      }
      
      if (first && last) {
        stock.pc = (last - first) / first
      }
    }))

    // Sort by percent change
    this.allStocks.sort((a, b) => a.pc - b.pc)
  }

  private async getTotalPrice(stocks: string[]): Promise<number[]> {
    return Promise.all(stocks.map(async stock => {
      const bars = await this.alpaca.getBarsV2(stock, {
        start: new Date(Date.now() - 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        timeframe: '1Min'
      })
      
      let price = 0
      for await (const bar of bars) {
        price = bar.ClosePrice
        break
      }
      return price
    }))
  }

  private async sendBatchOrder(quantity: number, stocks: string[], side: string): Promise<[string[], string[]]> {
    const incomplete: string[] = []
    const executed: string[] = []

    await Promise.all(stocks.map(async stock => {
      if (!this.blacklist.has(stock)) {
        const success = await this.submitOrder(quantity, stock, side)
        if (success) executed.push(stock)
        else incomplete.push(stock)
      }
    }))

    return [incomplete, executed]
  }

  private async submitOrder(quantity: number, stock: string, side: string): Promise<boolean> {
    if (quantity <= 0) {
      console.log(`Quantity <= 0, order for ${quantity} ${stock} ${side} not sent`)
      return true
    }

    try {
      await this.alpaca.createOrder({
        symbol: stock,
        qty: quantity,
        side: side,
        type: 'market',
        time_in_force: 'day'
      })
      console.log(`Market order of ${quantity} ${stock} ${side} completed.`)
      return true
    } catch (error) {
      console.log(`Order of ${quantity} ${stock} ${side} failed: ${error.message}`)
      return false
    }
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

export default function LongShortStrategy() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [positions, setPositions] = useState<any[]>([])

  useEffect(() => {
    const strategy = new LongShort(setStatus, setPositions)
    let mounted = true

    const initStrategy = async () => {
      try {
        if (mounted) {
          await strategy.run()
        }
      } catch (error) {
        console.error('Strategy error:', error)
        if (mounted) {
          setStatus('Error: ' + error.message)
        }
      }
    }

    initStrategy()

    return () => {
      mounted = false
      strategy.cleanup() // Clean up intervals
      setStatus('Strategy stopped')
    }
  }, [])

  return (
    <div className="bg-gray-50 rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Long-Short Strategy</h2>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">Status: {status}</div>
        {positions.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Current Positions</h3>
            <div className="space-y-2">
              {positions.map(position => (
                <div key={position.symbol} className="flex justify-between">
                  <span>{position.symbol}</span>
                  <span className={position.side === 'long' ? 'text-green-600' : 'text-red-600'}>
                    {position.side.toUpperCase()} - {position.qty} shares
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 