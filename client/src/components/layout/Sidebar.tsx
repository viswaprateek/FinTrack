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
  IconTags,
  IconTarget,
} from '../ui/icons'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/budgets', label: 'Budgets', icon: IconWallet },
  { to: '/categories', label: 'Categories', icon: IconTags },
  { to: '/transactions', label: 'Transactions', icon: IconReceipt },
  { to: '/goals', label: 'Goals', icon: IconTarget },
  { to: '/recurring', label: 'Recurring Bills', icon: IconRepeat },
  { to: '/reports', label: 'Reports', icon: IconBarChart },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-border bg-background/80 backdrop-blur-md lg:flex">
      <div className="shrink-0 flex items-center gap-2 px-6 py-6">
        <Logo />
        <span className="text-lg font-bold tracking-tight text-heading">FinTrack</span>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-muted-fg hover:bg-hover/60 hover:text-foreground',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto shrink-0 flex items-center gap-3 border-t border-border px-6 py-4">
        <UserButton afterSignOutUrl="/" />
        <span className="text-sm text-muted-fg">My Account</span>
      </div>
    </aside>
  )
}
