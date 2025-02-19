'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Message } from '@/types/chat'
import ModelSelector from './ModelSelector'
import MessageList from './MessageList'
import InputField from './InputField'

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState('sonar')
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Model Selector */}
      <div className="p-4 border-b border-gray-200">
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={handleModelChange}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200">
        <InputField
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          error={error}
        />
      </div>
    </div>
  )
} 