interface InputFieldProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  stop: () => void
  error?: Error
}

export default function InputField({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  error
}: InputFieldProps) {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    handleSubmit(e)
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder={error ? "An error occurred. Please try again..." : "Type your message..."}
        className={`flex-1 rounded-md border p-2 resize-none ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        rows={1}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit(e)
          }
        }}
      />
      {isLoading ? (
        <button
          type="button"
          onClick={stop}
          className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          Send
        </button>
      )}
    </form>
  )
} 