import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet } from 'react-router-dom'
import { PageLoader } from '../ui/Spinner'
import { hasClerkAuthCallbackParams } from '../../lib/clerkQueryParams'

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const finishingClerkCallback = hasClerkAuthCallbackParams() && !isSignedIn

  if (!isLoaded || finishingClerkCallback) {
    return <PageLoader label="Signing you in…" />
  }
  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return <Outlet />
}
