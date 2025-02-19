import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import { AuthProvider } from '@/contexts/AuthContext'
import RouteGuard from '@/components/auth/RouteGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradePro - Advanced Trading Platform',
  description: 'Professional-grade trading platform with real-time market data and AI-powered analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <RouteGuard>
            <WebSocketProvider>
              <div className="flex">
                {/* Only show sidebar on protected routes */}
                <div className="hidden md:block">
                  <Sidebar />
                </div>
                <main className="flex-1 md:ml-64 bg-gray-50 min-h-screen">
                  {children}
                </main>
              </div>
            </WebSocketProvider>
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  )
} 