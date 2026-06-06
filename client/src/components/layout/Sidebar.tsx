import { NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'
import {
  IconLayoutDashboard,
  IconWallet,
  IconReceipt,
  IconRepeat,
  IconBarChart,
  IconSettings,
} from '../ui/icons'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/budgets', label: 'Budgets', icon: IconWallet },
  { to: '/transactions', label: 'Transactions', icon: IconReceipt },
  { to: '/recurring', label: 'Recurring Bills', icon: IconRepeat },
  { to: '/reports', label: 'Reports', icon: IconBarChart },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <Logo />
        <span className="text-lg font-bold tracking-tight text-white">FinTrack</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-800 px-6 py-4">
        <UserButton afterSignOutUrl="/" />
        <span className="text-sm text-slate-400">My Account</span>
      </div>
    </aside>
  )
}
