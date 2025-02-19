'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const menuItems = [
    { name: 'Dashboard', path: '/TradingDashboard', icon: '📊' },
    { name: 'Market Analysis', path: '/MarketAnalysis', icon: '📈' },
    { name: 'Portfolio', path: '/Portfolio', icon: '💼' },
    { name: 'Orders', path: '/Orders', icon: '📝' },
    { name: 'Backtest', path: '/Backtest', icon: '🔬' },
    { name: 'AI Assistant', path: '/chat', icon: '🤖' },
    { name: 'Settings', path: '/Settings', icon: '⚙️' },
  ]

  if (!user) return null

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">TradePro</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
} 