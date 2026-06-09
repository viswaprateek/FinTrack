import { usePrivacy } from '../../contexts/PrivacyContext'
import { cn } from '../../lib/utils'
import { IconEye, IconEyeOff } from './icons'

interface PrivacyToggleProps {
  className?: string
}

export function PrivacyToggle({ className }: PrivacyToggleProps) {
  const { privacyMode, togglePrivacyMode } = usePrivacy()

  return (
    <button
      type="button"
      onClick={togglePrivacyMode}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-muted bg-input text-subtle transition-colors hover:bg-hover hover:text-heading',
        privacyMode && 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:text-amber-300',
        className,
      )}
      aria-label={privacyMode ? 'Show amounts' : 'Hide amounts'}
      title={privacyMode ? 'Privacy mode on — show amounts' : 'Privacy mode — hide amounts'}
    >
      {privacyMode ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
    </button>
  )
}
