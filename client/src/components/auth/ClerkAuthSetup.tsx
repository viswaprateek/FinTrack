import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { stripClerkQueryParams } from '../../lib/clerkQueryParams'

/**
 * After Clerk finishes loading (and handshake on deployed hosts), strip internal
 * query params so users land on a clean path like /dashboard.
 */
function hasActiveHandshake(): boolean {
  const params = new URL(window.location.href).searchParams
  return params.has('__clerk_handshake') || params.has('__clerk_handshake_nonce')
}

export function ClerkAuthSetup() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    // Wait until Clerk has turned the handshake into a session before cleaning the URL.
    if (hasActiveHandshake() && !isSignedIn) return
    stripClerkQueryParams()
  }, [isLoaded, isSignedIn])

  return null
}
