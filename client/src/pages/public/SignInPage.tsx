import { SignIn } from '@clerk/clerk-react'

export function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-16">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
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
