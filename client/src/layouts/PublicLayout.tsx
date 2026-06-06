import { Link, Outlet, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'

export function PublicLayout() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-bold tracking-tight text-white">FinTrack</span>
          </Link>

          {!isAuthPage && (
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="primary" size="sm">Get started</Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button variant="secondary" size="sm">Go to dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <p>© 2026 FinTrack. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
