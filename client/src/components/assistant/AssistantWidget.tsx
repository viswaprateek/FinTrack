import { useAppSelector } from '../../app/hooks'
import { AssistantChat } from './AssistantChat'
import { useAssistant } from './useAssistant'

export function AssistantWidget() {
  const { isOpen, toggle } = useAssistant()
  const hasPending = useAppSelector((s) => !!s.assistant.pendingTransaction)

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6 lg:z-50">
      {isOpen && <AssistantChat />}

      <button
        type="button"
        onClick={toggle}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-fg shadow-lg shadow-accent/25 transition-transform hover:bg-accent-hover hover:scale-105"
        aria-label={isOpen ? 'Close finance assistant' : 'Open finance assistant'}
      >
        ✨
        {!isOpen && hasPending && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-red-500" />
        )}
      </button>
    </div>
  )
}
