import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { cn } from '../../lib/utils'

interface AssistantInputProps {
  disabled: boolean
  isListening: boolean
  micSupported: boolean
  prefill?: string
  onSendText: (text: string) => void
  onSendImage: (file: File) => void
  onStartListening: (onTranscript: (text: string) => void) => void
  onStopListening: () => void
}

export function AssistantInput({
  disabled,
  isListening,
  micSupported,
  prefill,
  onSendText,
  onSendImage,
  onStartListening,
  onStopListening,
}: AssistantInputProps) {
  const [value, setValue] = useState(prefill ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (prefill !== undefined) setValue(prefill)
  }, [prefill])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSendText(trimmed)
    setValue('')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onSendImage(file)
    event.target.value = ''
  }

  const toggleMic = () => {
    if (isListening) {
      onStopListening()
      return
    }
    onStartListening((transcript) => setValue(transcript))
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-background/60 p-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="shrink-0 rounded-lg p-2 text-muted-fg transition-colors hover:bg-input hover:text-foreground disabled:opacity-50"
        title="Upload a screenshot"
        aria-label="Upload a screenshot"
      >
        🖼
      </button>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tell me about a transaction..."
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface-solid px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted disabled:opacity-50"
      />

      {micSupported ? (
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          className={cn(
            'shrink-0 rounded-lg p-2 transition-colors disabled:opacity-50',
            isListening ? 'animate-pulse bg-red-500 text-heading' : 'text-muted-fg hover:bg-input hover:text-foreground',
          )}
          title={isListening ? 'Stop recording' : 'Start voice input'}
          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
        >
          🎤
        </button>
      ) : (
        <span
          className="shrink-0 cursor-not-allowed rounded-lg p-2 text-muted"
          title="Voice input not supported in this browser"
        >
          🎤
        </span>
      )}

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40"
      >
        Send
      </button>
    </form>
  )
}
