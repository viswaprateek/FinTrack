import { Link, Outlet, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { cn } from '../lib/utils'

export function PublicLayout() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'
  const isLanding = pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className={cn(
          'z-40 transition-all duration-300',
          isLanding
            ? 'sticky top-0 border-b border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150'
            : 'border-b border-border/80',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-bold tracking-tight text-heading">FinTrack</span>
          </Link>

          {!isAuthPage && (
            <div className="flex items-center gap-3">
              <ThemeToggle />
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

      <footer className="border-t border-border/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
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
