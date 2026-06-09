import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { POST_AUTH_LANDING_PATH } from '../../components/auth/ClerkAuthSetup'

const redirectProps = {
  signInForceRedirectUrl: POST_AUTH_LANDING_PATH,
  signUpForceRedirectUrl: POST_AUTH_LANDING_PATH,
  signInFallbackRedirectUrl: POST_AUTH_LANDING_PATH,
  signUpFallbackRedirectUrl: POST_AUTH_LANDING_PATH,
}

/** Completes OAuth/SSO redirects from Clerk (e.g. /sign-in/sso-callback). */
export function ClerkSsoCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-16">
      <AuthenticateWithRedirectCallback {...redirectProps} />
    </div>
  )
}
