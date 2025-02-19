'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { restClient } from '@polygon.io/client-js'

interface WebSocketContextType {
  subscribe: (symbols: string[]) => void
  unsubscribe: (symbols: string[]) => void
  marketData: Record<string, any>
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [marketData, setMarketData] = useState<Record<string, any>>({})

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY!
    const rest = restClient(apiKey)
    
    // Create WebSocket connection
    const socket = new WebSocket(`wss://delayed.polygon.io/stocks`)
    
    socket.onopen = () => {
      console.log('Connected to Polygon WebSocket')
      setIsConnected(true)
      setWs(socket)
      
      // Authenticate immediately after connection
      socket.send(JSON.stringify({ 
        action: "auth", 
        params: apiKey
      }))
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data)) {
          data.forEach(msg => {
            if (msg.ev === 'T') { // Trade event
              setMarketData(prev => ({
                ...prev,
                [msg.sym]: {
                  price: msg.p,
                  size: msg.s,
                  timestamp: msg.t
                }
              }))
            }
          })
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    socket.onclose = () => {
      console.log('Disconnected from Polygon WebSocket')
      setIsConnected(false)
      setWs(null)
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [])

  const subscribe = (symbols: string[]) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        action: "subscribe",
        params: symbols.map(sym => `T.${sym}`)
      }))
    }
  }

  const unsubscribe = (symbols: string[]) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        action: "unsubscribe",
        params: symbols.map(sym => `T.${sym}`)
      }))
    }
  }

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, marketData, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
} 