interface OrderBookProps {
  orders: any[]
}

export default function OrderBook({ orders }: OrderBookProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Order Book</h2>
      <div className="overflow-y-auto max-h-[400px]">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="border-b border-gray-200 py-2"
          >
            <div className="flex justify-between">
              <span>{order.symbol}</span>
              <span className={
                order.side === 'buy' ? 'text-green-600' : 'text-red-600'
              }>
                {order.side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{order.qty} shares</span>
              <span>{order.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 