import { cn } from '../../lib/utils'
import type { LandingFace } from '../../lib/landingFaces'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11 sm:h-12 sm:w-12',
}

interface AvatarStackProps {
  faces: LandingFace[]
  size?: Size
  className?: string
  max?: number
}

export function AvatarStack({ faces, size = 'md', className, max = 5 }: AvatarStackProps) {
  const shown = faces.slice(0, max)

  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((face, index) => (
        <img
          key={face.id}
          src={face.src}
          alt={face.name}
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className={cn(
            'rounded-full border-2 border-surface-solid object-cover shadow-sm',
            sizeClasses[size],
            index > 0 && '-ml-2.5 sm:-ml-3',
          )}
          style={{ zIndex: shown.length - index }}
        />
      ))}
    </div>
  )
}
