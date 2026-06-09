import type { ReactElement, SVGProps } from 'react'
import type { BadgeIconKey } from '../../../lib/badgeDefinitions'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function BadgeIconReceipt(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2.5-1.5L3 21V3Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

export function BadgeIconFlame(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 22c4-2.5 6-5.5 6-9a6 6 0 0 0-10.5-4 4 4 0 0 0-1.5 6C8.5 17 10 19 12 22Z" />
      <path d="M12 22c-1.5-2-2-4-2-6a3 3 0 0 1 5-2" />
    </svg>
  )
}

export function BadgeIconEnvelope(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="m3 8 9 6 9-6" />
    </svg>
  )
}

export function BadgeIconTarget(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BadgeIconChart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 20V4M4 20h16" />
      <rect x="7" y="12" width="3" height="8" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="12" y="8" width="3" height="12" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="17" y="5" width="3" height="15" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BadgeIconCard(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  )
}

export function BadgeIconStar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m12 3 2.4 5.8 6.3.5-4.8 4.1 1.5 6.1L12 16.8 6.6 19.5l1.5-6.1L3.3 9.3l6.3-.5L12 3Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BadgeIconCalendar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export const BADGE_ICON_MAP: Record<BadgeIconKey, (props: IconProps) => ReactElement> = {
  'first-log': BadgeIconReceipt,
  'week-warrior': BadgeIconFlame,
  'envelope-starter': BadgeIconEnvelope,
  'goal-setter': BadgeIconTarget,
  'budget-builder': BadgeIconChart,
  'card-explorer': BadgeIconCard,
  consistent: BadgeIconStar,
  planner: BadgeIconCalendar,
}
