import { useId } from 'react'
import { cn } from '../../lib/utils'
import type { BadgeIconKey } from '../../lib/badgeDefinitions'
import { BADGE_ICON_MAP } from './badges/icons'

const GOLD_BRIGHT = ['#fff9c4', '#ffd54f', '#f5a623', '#c8870a'] as const
const GOLD_RIM_SILVER = ['#f8fafc', '#fde68a', '#d4d4d8', '#a8a29e'] as const

interface BadgeHexProps {
  ribbon: string
  tier?: 'silver' | 'gold'
  className?: string
}

export function BadgeHex({ ribbon, tier = 'silver', className }: BadgeHexProps) {
  const uid = useId().replace(/:/g, '')
  const metal = `metal-${uid}`
  const face = `face-${uid}`
  const gem = `gem-${uid}`
  const shine = `shine-${uid}`
  const goldRing = `gold-ring-${uid}`
  const ribbonGrad = `ribbon-${uid}`

  const rim = tier === 'gold' ? GOLD_BRIGHT : GOLD_RIM_SILVER

  return (
    <div className={cn('relative h-[76px] w-[64px]', className)}>
      <svg viewBox="0 0 80 92" className="h-full w-full drop-shadow-[0_4px_12px_rgba(245,166,35,0.2)]" aria-hidden>
        <defs>
          <linearGradient id={metal} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={rim[0]} />
            <stop offset="35%" stopColor={rim[1]} />
            <stop offset="70%" stopColor={rim[2]} />
            <stop offset="100%" stopColor={rim[3]} />
          </linearGradient>
          <linearGradient id={face} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0c1222" />
          </linearGradient>
          <linearGradient id={ribbonGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <radialGradient id={gem} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id={shine} cx="32%" cy="28%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={goldRing} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="50%" stopColor="#ffc82e" />
            <stop offset="100%" stopColor="#e0960a" />
          </linearGradient>
        </defs>

        <polygon points="40,3 72,18 72,52 40,89 8,52 8,18" fill={`url(#${metal})`} />
        <polygon
          points="40,7 68,19 68,51 40,84 12,51 12,19"
          fill="none"
          stroke="#ffeb8a"
          strokeWidth="0.75"
          opacity={tier === 'gold' ? 0.9 : 0.45}
        />
        <polygon
          points="40,9 66,22 66,50 40,81 14,50 14,22"
          fill={`url(#${face})`}
          stroke="#475569"
          strokeWidth="0.75"
        />

        <text
          x="40"
          y="30"
          textAnchor="middle"
          fill={`url(#${ribbonGrad})`}
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {ribbon}
        </text>

        <circle cx="40" cy="54" r="14.5" fill="none" stroke={`url(#${goldRing})`} strokeWidth="2" />
        <circle cx="40" cy="54" r="12.5" fill={`url(#${gem})`} stroke="#4ade80" strokeWidth="0.75" />
        <circle cx="40" cy="54" r="12.5" fill={`url(#${shine})`} />
        <ellipse cx="35.5" cy="49" rx="4" ry="2.5" fill="#ffffff" opacity="0.4" />
      </svg>
    </div>
  )
}

interface BadgeShieldProps {
  iconKey: BadgeIconKey
  className?: string
}

export function BadgeShield({ iconKey, className }: BadgeShieldProps) {
  const uid = useId().replace(/:/g, '')
  const stripes = `stripes-${uid}`
  const shieldGrad = `shield-${uid}`
  const gold = `gold-${uid}`
  const goldBright = `gold-bright-${uid}`
  const goldEdge = `gold-edge-${uid}`
  const Icon = BADGE_ICON_MAP[iconKey]

  return (
    <div className={cn('relative h-[96px] w-[80px]', className)}>
      <svg viewBox="0 0 100 118" className="h-full w-full drop-shadow-[0_6px_16px_rgba(255,200,46,0.25)]" aria-hidden>
        <defs>
          <pattern id={stripes} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
            <rect width="5" height="10" fill="#065f46" />
            <rect x="5" width="5" height="10" fill="#10b981" />
          </pattern>
          <linearGradient id={shieldGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9c4" />
            <stop offset="40%" stopColor="#ffd54f" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={goldBright} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffde7" />
            <stop offset="50%" stopColor="#ffca28" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id={goldEdge} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff4a8" />
            <stop offset="50%" stopColor="#ffc82e" />
            <stop offset="100%" stopColor="#c8870a" />
          </linearGradient>
        </defs>

        {/* gold outer glow */}
        <path
          d="M50 4 L90 19 L90 58 C90 84 69 104 50 114 C31 104 10 84 10 58 L10 19 Z"
          fill="none"
          stroke={`url(#${goldEdge})`}
          strokeWidth="3"
        />

        <path
          d="M50 6 L88 20 L88 58 C88 82 68 102 50 112 C32 102 12 82 12 58 L12 20 Z"
          fill={`url(#${stripes})`}
        />
        <path
          d="M50 6 L88 20 L88 58 C88 82 68 102 50 112 C32 102 12 82 12 58 L12 20 Z"
          fill={`url(#${shieldGrad})`}
        />

        <path
          d="M50 10 L82 22 L82 57 C82 78 65 96 50 105 C35 96 18 78 18 57 L18 22 Z"
          fill="none"
          stroke={`url(#${goldBright})`}
          strokeWidth="2.25"
        />

        {/* inner gold accent line */}
        <path
          d="M50 14 L78 24 L78 55 C78 73 64 89 50 97 C36 89 22 73 22 55 L22 24 Z"
          fill="none"
          stroke="#ffeb8a"
          strokeWidth="0.75"
          opacity="0.55"
        />

        {/* trophy pin */}
        <g transform="translate(60, 8)">
          <circle cx="13" cy="6" r="5" fill={`url(#${gold})`} opacity="0.35" />
          <rect x="5" y="11" width="12" height="10" rx="1.5" fill={`url(#${goldBright})`} stroke="#b45309" strokeWidth="0.75" />
          <path d="M7 11 V7.5a3.5 3.5 0 0 1 8 0V11" fill="none" stroke={`url(#${gold})`} strokeWidth="1.75" />
          <path d="M8 21 h6 l-1.2 3.5 h-3.6 Z" fill="#d97706" />
          <circle cx="11" cy="5.5" r="2.2" fill="#fff9c4" stroke="#f59e0b" strokeWidth="0.6" />
          <ellipse cx="10" cy="4.8" rx="1" ry="0.6" fill="#ffffff" opacity="0.55" />
        </g>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pt-3">
        <div className="rounded-full bg-amber-300/15 p-2 ring-1 ring-amber-300/40">
          <Icon
            className="h-8 w-8 text-amber-50 drop-shadow-[0_0_6px_rgba(255,214,80,0.55)]"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  )
}
