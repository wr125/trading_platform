'use client'

import { useState } from 'react'

interface TradeFormProps {
  symbol: string
  onSubmit: (order: any) => Promise<void>
}

export default function TradeForm({ symbol, onSubmit }: TradeFormProps) {
  const [quantity, setQuantity] = useState('')

  const handleSubmit = async (side: 'buy' | 'sell') => {
    if (!quantity) return
    
    await onSubmit({
      symbol,
      qty: parseInt(quantity),
      side,
      type: 'market',
      time_in_force: 'day'
    })
    setQuantity('')
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Place Order</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            min="1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSubmit('buy')}
            disabled={!quantity}
            className="w-full py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy
          </button>
          <button
            onClick={() => handleSubmit('sell')}
            disabled={!quantity}
            className="w-full py-2 px-4 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  )
} 