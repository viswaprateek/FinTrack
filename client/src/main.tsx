import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Provider as ReduxProvider } from 'react-redux'
import './index.css'
import { router } from './app/router'
import { store } from './app/store'
import { ThemeProvider } from './contexts/ThemeContext'
import { ClerkAuthSetup } from './components/auth/ClerkAuthSetup'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file')
}

const clerkRedirectOrigins =
  typeof window !== 'undefined' ? [window.location.origin] : undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL ?? '/sign-in'}
        signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL ?? '/sign-up'}
        signInForceRedirectUrl={import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL ?? '/dashboard'}
        signUpForceRedirectUrl={import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL ?? '/dashboard'}
        signInFallbackRedirectUrl={import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/dashboard'}
        signUpFallbackRedirectUrl={import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/dashboard'}
        allowedRedirectOrigins={clerkRedirectOrigins}
      >
        <ClerkAuthSetup />
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ReduxProvider>
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>,
)
