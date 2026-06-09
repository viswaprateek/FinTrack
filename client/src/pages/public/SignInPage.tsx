import { SignIn } from '@clerk/clerk-react'
import { POST_AUTH_LANDING_PATH } from '../../components/auth/ClerkAuthSetup'
import { useClerkAppearance } from '../../lib/clerkAppearance'

export function SignInPage() {
  const appearance = useClerkAppearance()

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-16">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={POST_AUTH_LANDING_PATH}
        appearance={appearance}
      />
    </div>
  )
}
