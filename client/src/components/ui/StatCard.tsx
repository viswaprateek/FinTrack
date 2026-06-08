import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string
  subLabel?: string
  icon?: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  iconColor?: string
  iconBg?: string
  compact?: boolean
}

const toneStyles = {
  neutral: 'text-slate-100',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
}

export function StatCard({ label, value, subLabel, icon, tone = 'neutral', iconColor, iconBg, compact }: StatCardProps) {
  return (
    <Card className={cn(compact ? 'p-4' : 'p-5', 'h-full')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium uppercase tracking-wide text-slate-500', compact ? 'text-[10px]' : 'text-xs')}>
            {label}
          </p>
          <p className={cn('font-bold tracking-tight', compact ? 'mt-1.5 text-xl' : 'mt-2 text-2xl', toneStyles[tone])}>
            {value}
          </p>
          {subLabel && (
            <p className={cn('text-slate-500', compact ? 'mt-0.5 text-[10px] line-clamp-2' : 'mt-1 text-xs')}>
              {subLabel}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'shrink-0 rounded-xl',
              compact ? 'p-2' : 'p-2.5',
              iconBg ?? 'bg-slate-800/80',
              iconColor ?? 'text-slate-400',
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
