import { useEffect, useRef, useState } from 'react'
import { AssistantInput } from './AssistantInput'
import { AssistantMessage } from './AssistantMessage'
import { useAssistant } from './useAssistant'

const SUGGESTIONS = [
  'I spent ₹500 on Zomato',
  'How much did I spend on groceries?',
  'What is my budget remaining?',
]

export function AssistantChat() {
  const assistant = useAssistant()
  const {
    messages,
    isLoading,
    isListening,
    error,
    pendingTransaction,
    categories,
    micSupported,
    sendText,
    sendImage,
    startListening,
    stopListening,
    speak,
    confirmTransaction,
    updateTransaction,
    close,
  } = assistant

  const [draft, setDraft] = useState<string | undefined>(undefined)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingTransaction, isLoading])

  const handleSendText = (text: string) => {
    setDraft(undefined)
    sendText(text, isListening).catch(() => undefined)
  }

  const lastTransactionMessageId = [...messages].reverse().find((m) => m.pendingTransaction)?.id

  return (
    <div className="flex h-[520px] w-[380px] flex-col overflow-hidden rounded-xl border border-border bg-surface-solid shadow-lg shadow-black/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.06]">
      <header className="flex items-center justify-between border-b border-border bg-surface-solid px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-accent-fg">
            ✨
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Finance Assistant</p>
            {isListening && <p className="text-xs text-red-400">Listening…</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-muted-fg transition-colors hover:bg-input hover:text-foreground"
          aria-label="Close assistant"
        >
          ✕
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-fg">
              Hi! Tell me about a transaction — type it, paste a bank SMS, upload a screenshot, or use your voice.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDraft(suggestion)}
                  className="rounded-full border border-border bg-surface-solid px-3 py-1.5 text-xs text-subtle transition-colors hover:border-accent hover:text-heading"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <AssistantMessage
            key={message.id}
            message={message}
            activeTransaction={message.id === lastTransactionMessageId ? pendingTransaction : null}
            categories={categories}
            isSubmitting={isLoading}
            onSpeak={speak}
            onChangeTransaction={updateTransaction}
            onConfirmTransaction={() => {
              if (pendingTransaction) confirmTransaction(pendingTransaction).catch(() => undefined)
            }}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-surface-solid px-4 py-3 text-muted-fg">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
              </span>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <AssistantInput
        disabled={isLoading}
        isListening={isListening}
        micSupported={micSupported}
        prefill={draft}
        onSendText={handleSendText}
        onSendImage={(file) => sendImage(file).catch(() => undefined)}
        onStartListening={startListening}
        onStopListening={stopListening}
      />
    </div>
  )
}
