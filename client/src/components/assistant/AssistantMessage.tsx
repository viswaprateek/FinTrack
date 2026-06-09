import { cn } from '../../lib/utils'
import type { Category } from '../../types'
import { TransactionConfirmCard } from './TransactionConfirmCard'
import type { Message, ParsedTransaction } from './assistant.types'

interface AssistantMessageProps {
  message: Message
  /** The live, editable transaction — only provided for the message that owns the
   * still-pending confirmation card. Older cards are resolved and render as plain text. */
  activeTransaction?: ParsedTransaction | null
  categories: Category[]
  isSubmitting: boolean
  onSpeak: (text: string) => void
  onChangeTransaction: (patch: Partial<ParsedTransaction>) => void
  onConfirmTransaction: () => void
}

export function AssistantMessage({
  message,
  activeTransaction,
  categories,
  isSubmitting,
  onSpeak,
  onChangeTransaction,
  onConfirmTransaction,
}: AssistantMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser ? 'bg-accent text-accent-fg' : 'border border-border bg-surface-solid text-foreground',
        )}
      >
        {message.imagePreview && (
          <img
            src={message.imagePreview}
            alt="Uploaded attachment preview"
            className="mb-2 max-h-40 rounded-lg border border-border-muted object-cover"
          />
        )}

        <div className="flex items-start gap-2">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {!isUser && (
            <button
              type="button"
              onClick={() => onSpeak(message.content)}
              className="shrink-0 text-muted-fg transition-colors hover:text-foreground"
              title="Replay message"
              aria-label="Replay message"
            >
              🔊
            </button>
          )}
        </div>

        {message.pendingTransaction && activeTransaction && (
          <TransactionConfirmCard
            transaction={activeTransaction}
            categories={categories}
            isSubmitting={isSubmitting}
            onChange={onChangeTransaction}
            onConfirm={onConfirmTransaction}
          />
        )}
      </div>
    </div>
  )
}
