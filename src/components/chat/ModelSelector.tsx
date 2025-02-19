import type { AIModel } from '../../types/chat'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <select
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2"
    >
      <option value="sonar">Perplexity Sonar</option>
    </select>
  )
} 