import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { IconArrowRight } from '../components/ui/icons'

function getErrorDetails(error: unknown, notFound: boolean) {
  if (notFound) {
    return {
      status: 404,
      title: 'Page not found',
      message: "This page doesn't exist or may have been moved.",
    }
  }

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        status: 404,
        title: 'Page not found',
        message: "This page doesn't exist or may have been moved.",
      }
    }
    return {
      status: error.status,
      title: 'Something went wrong',
      message:
        typeof error.data === 'string'
          ? error.data
          : error.statusText || 'An unexpected error occurred.',
    }
  }

  if (error instanceof Error) {
    return {
      status: null,
      title: 'Something went wrong',
      message: import.meta.env.DEV ? error.message : 'An unexpected error occurred. Please try again.',
    }
  }

  return {
    status: null,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  }
}

function ErrorPageContent({
  status,
  title,
  message,
}: {
  status: number | null
  title: string
  message: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-heading">FinTrack</span>
        </Link>

        {status && (
          <p className="mt-10 text-6xl font-bold tracking-tight text-accent">{status}</p>
        )}

        <h1 className="mt-4 text-2xl font-semibold text-heading">{title}</h1>
        <p className="mt-2 text-sm text-muted-fg">{message}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/">
            <Button size="md">
              Go home
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const details = getErrorDetails(error, false)
  return <ErrorPageContent {...details} />
}

export function NotFoundPage() {
  const details = getErrorDetails(null, true)
  return <ErrorPageContent {...details} />
}
