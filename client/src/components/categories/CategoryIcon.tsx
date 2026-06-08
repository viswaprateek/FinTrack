import { cn } from '../../lib/utils'
import { getCategoryTemplate } from '../../lib/categoryTemplates'

interface CategoryIconProps {
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

export function CategoryIcon({ name, icon, size = 'md', className }: CategoryIconProps) {
  const template = getCategoryTemplate(icon, name)
  const emoji = template?.emoji ?? name.charAt(0).toUpperCase()
  const color = template?.color ?? 'bg-input text-subtle'

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
      {template ? emoji : <span className="text-sm font-semibold">{emoji}</span>}
    </span>
  )
}
