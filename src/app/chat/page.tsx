import { Suspense } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ChatPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Trading Assistant</h1>
      <div className="bg-white rounded-lg shadow">
        <Suspense fallback={<LoadingSpinner />}>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  )
} 