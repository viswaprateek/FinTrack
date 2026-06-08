import { SignUp } from '@clerk/clerk-react'
import { POST_AUTH_LANDING_PATH } from '../../components/auth/ClerkAuthSetup'

export function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-16">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={POST_AUTH_LANDING_PATH}
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-surface-solid border border-border shadow-xl shadow-black/30',
          },
        }}
      />
    </div>
  )
}
