import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { IconMore } from '../ui/icons'
import { MobileMoreSheet } from './MobileMoreSheet'
import { mobileMoreRoutes, mobilePrimaryNav } from './navConfig'

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const moreActive = mobileMoreRoutes.some((r) => pathname.startsWith(r))

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-solid lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {mobilePrimaryNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
              moreActive || moreOpen ? 'text-accent' : 'text-muted',
            )}
            aria-label="More navigation"
            aria-expanded={moreOpen}
          >
            <IconMore className="h-5 w-5 shrink-0" />
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
