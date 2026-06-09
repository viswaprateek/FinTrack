import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/Card'
import { ContentLoader } from '../../components/ui/Spinner'
import { expenseSharesApi, type PublicOweView } from '../../api/endpoints/expenseShares'
import { formatShortDate } from '../../lib/utils'

export function OwePage() {
  const { token } = useParams()
  const [data, setData] = useState<PublicOweView | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    expenseSharesApi
      .publicOwe(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ContentLoader label="Loading…" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-heading">Link not found</h1>
        <p className="mt-2 text-sm text-muted">This payment link may have expired or is invalid.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-hover">
          Go to FinTrack
        </Link>
      </div>
    )
  }

  const formatted = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.currency,
  }).format(data.amountOwed)

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-muted">Payment request from</p>
          <h1 className="text-xl font-semibold text-heading">{data.payerName}</h1>
          <div>
            <p className="text-3xl font-bold text-heading">{formatted}</p>
            <p className="mt-2 text-sm text-muted">{data.description}</p>
            <p className="text-xs text-muted">{formatShortDate(data.date)}</p>
          </div>
          <p
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              data.status === 'paid'
                ? 'bg-success-muted text-success'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {data.status === 'paid' ? 'Marked as paid' : 'Payment pending'}
          </p>
          <p className="text-xs text-muted">
            Settle outside FinTrack (cash, UPI, Venmo, etc.) — your friend will mark this paid in the app.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
