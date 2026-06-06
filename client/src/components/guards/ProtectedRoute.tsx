import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet } from 'react-router-dom'
import { PageLoader } from '../ui/Spinner'

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <PageLoader label="Signing you in…" />
  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return <Outlet />
}
