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
}

const toneStyles = {
  neutral: 'text-slate-100',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
}

export function StatCard({ label, value, subLabel, icon, tone = 'neutral', iconColor, iconBg }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={cn('mt-2 text-2xl font-bold tracking-tight', toneStyles[tone])}>{value}</p>
          {subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
        </div>
        {icon && (
          <div className={cn('shrink-0 rounded-xl p-2.5', iconBg ?? 'bg-slate-800/80', iconColor ?? 'text-slate-400')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
