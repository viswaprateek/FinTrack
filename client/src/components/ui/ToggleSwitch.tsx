import { cn } from '../../lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  'aria-label'?: string
}

export function ToggleSwitch({ checked, onChange, disabled, 'aria-label': ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-accent' : 'bg-border-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
