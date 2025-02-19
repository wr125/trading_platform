'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface UserSettings {
  notifications: {
    priceAlerts: boolean
    tradeConfirmations: boolean
    marketNews: boolean
  }
  membership: {
    type: 'free' | 'paid'
    validUntil?: string
  }
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    tradeConfirmations: true,
    marketNews: false,
  })

  // Mock membership data - replace with actual data from your backend
  const [membership] = useState<UserSettings['membership']>({
    type: 'free',
    validUntil: undefined
  })

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <p className="mt-1 text-gray-900">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Active
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Membership Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Membership</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Current Plan</p>
              <p className="text-lg font-medium mt-1 flex items-center">
                {membership.type === 'paid' ? (
                  <>
                    <span className="text-green-600">Premium Member</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <span>Free Tier</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      Limited
                    </span>
                  </>
                )}
              </p>
              {membership.validUntil && (
                <p className="text-sm text-gray-500 mt-1">
                  Valid until: {new Date(membership.validUntil).toLocaleDateString()}
                </p>
              )}
            </div>
            {membership.type === 'free' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => {/* Implement upgrade flow */}}
              >
                Upgrade to Premium
              </button>
            )}
          </div>
          
          {/* Plan Features */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Plan Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <svg className={`h-5 w-5 ${membership.type === 'paid' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">Real-time Market Data</span>
              </li>
              <li className="flex items-center text-sm">
                <svg className={`h-5 w-5 ${membership.type === 'paid' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">Advanced Trading Strategies</span>
              </li>
              <li className="flex items-center text-sm">
                <svg className={`h-5 w-5 ${membership.type === 'paid' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">AI-Powered Analysis</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Price Alerts</label>
                <p className="text-sm text-gray-500">Get notified of significant price movements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.priceAlerts}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    priceAlerts: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Trade Confirmations</label>
                <p className="text-sm text-gray-500">Receive notifications for executed trades</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.tradeConfirmations}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    tradeConfirmations: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Market News</label>
                <p className="text-sm text-gray-500">Stay updated with market news and analysis</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.marketNews}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    marketNews: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 