import { useEffect, useId, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '../../contexts/CurrencyContext'
import { SUPPORTED_CURRENCIES, formatCurrencyAmount } from '../../lib/currencies'
import { convertAmount, fetchExchangeRate, rateSourceLabel } from '../../lib/exchangeRates'
import { cn } from '../../lib/utils'
import { IconArrowLeftRight, IconCalculator } from '../ui/icons'

const TO_CURRENCY_KEY = 'fintrack-converter-to-currency'
const ONE_HOUR_MS = 60 * 60 * 1000

function readStoredToCurrency(fallback: string): string {
  try {
    const stored = localStorage.getItem(TO_CURRENCY_KEY)
    if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) return stored
  } catch {
    // ignore
  }
  return fallback
}

function defaultToCurrency(homeCurrency: string): string {
  if (homeCurrency !== 'USD') return 'USD'
  return 'EUR'
}

const selectClassName =
  'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/20'

export function CurrencyConverter() {
  const { currency: homeCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState(homeCurrency)
  const [toCurrency, setToCurrency] = useState(() => readStoredToCurrency(defaultToCurrency(homeCurrency)))
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    setFromCurrency(homeCurrency)
  }, [homeCurrency, open])

  useEffect(() => {
    try {
      localStorage.setItem(TO_CURRENCY_KEY, toCurrency)
    } catch {
      // ignore
    }
  }, [toCurrency])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const parsedAmount = Number.parseFloat(amount)
  const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount >= 0

  const rateQuery = useQuery({
    queryKey: ['exchange-rate', fromCurrency, toCurrency],
    queryFn: () => fetchExchangeRate(fromCurrency, toCurrency),
    enabled: open,
    staleTime: ONE_HOUR_MS,
    retry: 1,
  })

  const convertedAmount =
    hasValidAmount && rateQuery.data ? convertAmount(parsedAmount, rateQuery.data.rate) : null

  function swapCurrencies() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const rateLabel =
    rateQuery.data && fromCurrency !== toCurrency
      ? `1 ${fromCurrency} = ${formatCurrencyAmount(rateQuery.data.rate, toCurrency)}`
      : fromCurrency === toCurrency
        ? `1 ${fromCurrency} = ${formatCurrencyAmount(1, toCurrency)}`
        : null

  return (
    <div ref={containerRef} className={cn('relative', open && 'z-50')}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close currency converter' : 'Open currency converter'}
        className={cn(
          'flex items-center justify-center p-1 transition-colors',
          open ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400',
        )}
      >
        <IconCalculator className="h-5 w-5" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Currency converter"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40"
        >
          <div className="border-b border-slate-800/80 bg-gradient-to-r from-emerald-500/10 via-transparent to-sky-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Currency converter</p>
            <p className="mt-0.5 text-xs text-slate-500">Quick reference — rates are approximate</p>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <label htmlFor={`${panelId}-amount`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Amount
              </label>
              <input
                id={`${panelId}-amount`}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-lg font-semibold tabular-nums text-white focus:border-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div>
                <label htmlFor={`${panelId}-from`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  From
                </label>
                <select
                  id={`${panelId}-from`}
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className={selectClassName}
                >
                  {SUPPORTED_CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={swapCurrencies}
                aria-label="Swap currencies"
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-400"
              >
                <IconArrowLeftRight className="h-4 w-4" />
              </button>

              <div>
                <label htmlFor={`${panelId}-to`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  To
                </label>
                <select
                  id={`${panelId}-to`}
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className={selectClassName}
                >
                  {SUPPORTED_CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              {rateQuery.isLoading ? (
                <p className="text-sm text-slate-400">Fetching rate…</p>
              ) : rateQuery.isError ? (
                <p className="text-sm text-red-400">Could not load rate. Try another pair.</p>
              ) : convertedAmount != null ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/80">Result</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                    {formatCurrencyAmount(convertedAmount, toCurrency)}
                  </p>
                  {hasValidAmount && fromCurrency !== toCurrency && (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCurrencyAmount(parsedAmount, fromCurrency)} → {formatCurrencyAmount(convertedAmount, toCurrency)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Enter a valid amount to convert.</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800/80 px-4 py-2.5">
            {rateLabel && rateQuery.data && (
              <p className="text-[11px] text-slate-500">
                {rateLabel}
                {rateQuery.data.date
                  ? ` · ${rateSourceLabel(rateQuery.data.source)} rate as of ${rateQuery.data.date}`
                  : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
