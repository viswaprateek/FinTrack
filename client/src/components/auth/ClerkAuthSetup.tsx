import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { router } from '../../app/router'
import { hasClerkAuthCallbackParams, stripClerkQueryParams } from '../../lib/clerkQueryParams'

/**
 * After Clerk finishes the handshake on deployed hosts, replace the URL with a clean
 * path (e.g. /dashboard) via React Router so protected pages render correctly.
 */
export function ClerkAuthSetup() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasClerkAuthCallbackParams()) return

    const targetPath = window.location.pathname
    stripClerkQueryParams()
    router.navigate(targetPath, { replace: true })
  }, [isLoaded, isSignedIn])

  return null
}
