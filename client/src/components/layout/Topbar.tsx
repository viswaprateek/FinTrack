import { useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/budgets': 'Budgets',
  '/transactions': 'Transactions',
  '/recurring': 'Recurring Bills',
  '/reports': 'Reports & Forecasts',
  '/settings': 'Settings',
}

function pageTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/budgets/')) return 'Budget Detail'
  return 'FinTrack'
}

export function Topbar() {
  const { pathname } = useLocation()

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4 backdrop-blur-sm lg:px-8">
      <div>
        <h1 className="text-lg font-semibold text-white">{pageTitle(pathname)}</h1>
        <p className="text-sm text-slate-500">June 2026</p>
      </div>

      <div className="flex items-center gap-3 lg:hidden">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}
