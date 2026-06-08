import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { router } from '../../app/router'
import { hasClerkAuthCallbackParams, stripClerkQueryParams } from '../../lib/clerkQueryParams'

/** Where Clerk sends users after sign-in on Vercel (public route — handshake can finish here). */
export const POST_AUTH_LANDING_PATH = '/'

/**
 * Temporary workaround for Clerk handshake on Vercel + dev instance:
 * finish auth on the public landing page, then client-navigate to the dashboard.
 */
export function ClerkAuthSetup() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    if (hasClerkAuthCallbackParams()) {
      stripClerkQueryParams()
      router.navigate(POST_AUTH_LANDING_PATH, { replace: true })
      return
    }

    if (window.location.pathname === POST_AUTH_LANDING_PATH) {
      router.navigate('/dashboard', { replace: true })
    }
  }, [isLoaded, isSignedIn])

  return null
}
