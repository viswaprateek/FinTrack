import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router-dom'
import { useApiClient, usersApi } from '../../api'

/**
 * Redirects incomplete onboarding to `/onboarding`.
 * Renders the app shell immediately while `/me` loads — no full-page blocker.
 */
export function OnboardingGate() {
  const client = useApiClient()
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(client),
    staleTime: 5 * 60_000,
  })

  if (meQuery.isSuccess && !meQuery.data.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
