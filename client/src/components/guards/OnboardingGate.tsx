import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router-dom'
import { useApiClient, usersApi } from '../../api'
import { PageLoader } from '../ui/Spinner'

/** Redirects users who haven't finished onboarding to `/onboarding`. */
export function OnboardingGate() {
  const client = useApiClient()
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(client),
  })

  if (meQuery.isLoading) {
    return <PageLoader label="Loading your account…" />
  }

  if (meQuery.isError || !meQuery.data) {
    return <PageLoader label="Loading your account…" />
  }

  if (!meQuery.data.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
