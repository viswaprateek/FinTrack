import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { router } from '../../app/router'
import { setAuthGetToken } from '../../api/setupAuthInterceptor'
import { hasClerkAuthCallbackParams, stripClerkQueryParams } from '../../lib/clerkQueryParams'

/** Where Clerk sends users after auth on Vercel (public route — handshake can finish here). */
export const POST_AUTH_LANDING_PATH = '/'

function isSsoCallbackPath(pathname: string): boolean {
  return pathname.endsWith('/sso-callback')
}

/**
 * Workaround for Clerk handshake on Vercel + dev instance:
 * finish auth on `/`, then client-navigate into the app.
 * OAuth/SSO callbacks (/sign-in/sso-callback) are handled separately — do not redirect away.
 */
export function ClerkAuthSetup() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  // Sync on every render so requests never use a stale getToken closure.
  setAuthGetToken(() => getTokenRef.current())

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (isSsoCallbackPath(window.location.pathname)) return

    if (hasClerkAuthCallbackParams()) {
      stripClerkQueryParams()
      if (window.location.pathname !== POST_AUTH_LANDING_PATH) {
        router.navigate(POST_AUTH_LANDING_PATH, { replace: true })
      }
      return
    }

    if (window.location.pathname === POST_AUTH_LANDING_PATH) {
      router.navigate('/dashboard', { replace: true })
    }
  }, [isLoaded, isSignedIn])

  return null
}
