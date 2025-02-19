'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const { user, signInWithGoogle, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">TradePro</span>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{user.email}</span>
                  <Link
                    href="/TradingDashboard"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Image
                    src="/google-icon.svg"
                    alt="Google"
                    width={24}
                    height={24}
                    className="mr-2"
                    priority
                  />
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">
            Advanced Trading Platform
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Professional-grade trading tools with real-time market data, AI-powered analysis, 
            and automated trading strategies.
          </p>
          {user ? (
            <Link
              href="/TradingDashboard"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Real-Time Data</h3>
            <p className="text-gray-600">
              Access live market data and advanced charting tools for informed trading decisions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">AI Assistant</h3>
            <p className="text-gray-600">
              Get AI-powered insights and trading recommendations based on market analysis.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Automated Trading</h3>
            <p className="text-gray-600">
              Set up and backtest automated trading strategies with ease.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 