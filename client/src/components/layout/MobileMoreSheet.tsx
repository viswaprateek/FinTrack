import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { IconBarChart, IconRepeat, IconSettings, IconX } from '../ui/icons'

const moreItems = [
  { to: '/reports', label: 'Reports & Forecasts', icon: IconBarChart, description: 'Cashflow and trends' },
  { to: '/recurring', label: 'Recurring Bills', icon: IconRepeat, description: 'Automated payments' },
  { to: '/settings', label: 'Settings', icon: IconSettings, description: 'Account & preferences' },
]

interface MobileMoreSheetProps {
  open: boolean
  onClose: () => void
}

export function MobileMoreSheet({ open, onClose }: MobileMoreSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="More navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-slate-700 bg-slate-900 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-2">
          {moreItems.map(({ to, label, icon: Icon, description }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors',
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-200 hover:bg-slate-800/80',
                )
              }
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
