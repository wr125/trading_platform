export type AIModel = 'sonar'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'function'
  content: string
}

export interface ChatState {
  messages: Message[]
  selectedModel: AIModel
} 