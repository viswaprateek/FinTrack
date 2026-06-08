import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  IconLayoutDashboard,
  IconReceipt,
  IconTags,
  IconWallet,
  IconBarChart,
} from '../ui/icons'

const items = [
  { to: '/dashboard', label: 'Home', icon: IconLayoutDashboard },
  { to: '/transactions', label: 'Ledger', icon: IconReceipt },
  { to: '/categories', label: 'Categories', icon: IconTags },
  { to: '/budgets', label: 'Budgets', icon: IconWallet },
  { to: '/reports', label: 'Reports', icon: IconBarChart },
]

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm lg:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-emerald-400' : 'text-slate-500',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
