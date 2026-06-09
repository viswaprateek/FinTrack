import { useId } from 'react'
import { cn } from '../../lib/utils'

interface BadgeHexProps {
  ribbon?: string
  className?: string
}

export function BadgeHex({ ribbon, className }: BadgeHexProps) {
  const borderId = useId()

  return (
    <div className={cn('relative flex h-[72px] w-[60px] items-center justify-center', className)}>
      <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full drop-shadow-sm" aria-hidden>
        <defs>
          <linearGradient id={borderId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4d4d8" />
            <stop offset="50%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>
        <polygon
          points="32,4 58,18 58,46 32,68 6,46 6,18"
          fill="#1e293b"
          stroke={`url(#${borderId})`}
          strokeWidth="2.5"
        />
        <polygon points="32,12 50,22 50,42 32,58 14,42 14,22" fill="#0f172a" />
        <circle cx="32" cy="36" r="10" fill="#34d399" opacity="0.9" />
      </svg>
      {ribbon && (
        <span className="relative z-10 mt-6 text-[8px] font-bold uppercase tracking-wide text-emerald-300">
          {ribbon}
        </span>
      )}
    </div>
  )
}

interface BadgeShieldProps {
  emoji: string
  className?: string
}

export function BadgeShield({ emoji, className }: BadgeShieldProps) {
  const patternId = useId()

  return (
    <div className={cn('relative flex h-[88px] w-[72px] items-center justify-center', className)}>
      <svg viewBox="0 0 72 88" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
        <defs>
          <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="4" height="8" fill="#064e3b" />
            <rect x="4" width="4" height="8" fill="#10b981" />
          </pattern>
        </defs>
        <path
          d="M36 4 L64 16 L64 44 C64 62 50 78 36 84 C22 78 8 62 8 44 L8 16 Z"
          fill={`url(#${patternId})`}
          stroke="#6ee7b7"
          strokeWidth="2"
        />
        <path d="M52 14 L58 10 L56 18 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
        <rect x="54" y="8" width="3" height="6" rx="0.5" fill="#fbbf24" />
      </svg>
      <span className="relative z-10 text-2xl">{emoji}</span>
    </div>
  )
}
