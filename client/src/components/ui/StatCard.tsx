import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

const toneStyles = {
  neutral: 'text-slate-100',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
}

export function StatCard({ label, value, icon, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={cn('mt-2 text-2xl font-bold tracking-tight', toneStyles[tone])}>{value}</p>
        </div>
        {icon && <div className="rounded-xl bg-slate-800/80 p-2.5 text-slate-400">{icon}</div>}
      </div>
    </Card>
  )
}
