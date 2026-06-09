import { NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'
import { settingsNavItem, sidebarSections } from './navConfig'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-border bg-surface-solid lg:flex">
      <div className="flex shrink-0 items-center gap-2 px-6 py-6">
        <Logo />
        <span className="text-lg font-bold tracking-tight text-heading">FinTrack</span>
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3" aria-label="Main navigation">
        {sidebarSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-muted font-medium text-accent'
                        : 'text-subtle hover:bg-hover hover:text-heading',
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-border px-3 py-3">
        <NavLink
          to={settingsNavItem.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent-muted font-medium text-accent'
                : 'text-subtle hover:bg-hover hover:text-heading',
            )
          }
        >
          <settingsNavItem.icon className="h-[18px] w-[18px] shrink-0" />
          {settingsNavItem.label}
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-subtle">My Account</span>
        </div>
      </div>
    </aside>
  )
}
