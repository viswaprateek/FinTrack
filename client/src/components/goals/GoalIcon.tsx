import { cn } from '../../lib/utils'
import { getGoalTemplate } from '../../lib/goalTemplates'

interface GoalIconProps {
  name: string
  icon?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-lg',
  lg: 'h-12 w-12 text-xl',
}

export function GoalIcon({ name, icon, size = 'md', className }: GoalIconProps) {
  const template = getGoalTemplate(icon, name)
  const emoji = template?.emoji ?? '🎯'
  const color = template?.color ?? 'bg-accent-muted text-accent'

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl font-medium',
        sizeClasses[size],
        color,
        className,
      )}
      aria-hidden
    >
      {emoji}
    </span>
  )
}
