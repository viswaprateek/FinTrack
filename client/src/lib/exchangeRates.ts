export interface ExchangeRateQuote {
  rate: number
  date: string
  source: 'frankfurter' | 'exchangerate-api'
}

/** https://frankfurter.dev — v2 API, no key required */
const FRANKFURTER_API = 'https://api.frankfurter.dev'
const ER_API = 'https://open.er-api.com/v6/latest/USD'

export async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRateQuote> {
  if (from === to) {
    return { rate: 1, date: new Date().toISOString().slice(0, 10), source: 'frankfurter' }
  }

  try {
    return await fetchFromFrankfurter(from, to)
  } catch {
    return fetchFromExchangeRateApi(from, to)
  }
}

/**
 * Frankfurter has no conversion endpoint — fetch the pair rate and multiply client-side.
 * @see https://frankfurter.dev — GET /v2/rate/{base}/{quote}
 */
async function fetchFromFrankfurter(from: string, to: string): Promise<ExchangeRateQuote> {
  const response = await fetch(
    `${FRANKFURTER_API}/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
  )

  if (!response.ok) {
    throw new Error('Frankfurter request failed')
  }

  const data = (await response.json()) as {
    date: string
    base: string
    quote: string
    rate: number
  }

  if (data.rate == null) {
    throw new Error(`No Frankfurter rate for ${from} → ${to}`)
  }

  return { rate: data.rate, date: data.date, source: 'frankfurter' }
}

async function fetchFromExchangeRateApi(from: string, to: string): Promise<ExchangeRateQuote> {
  const response = await fetch(ER_API)
  if (!response.ok) {
    throw new Error('Exchange rate fallback request failed')
  }

  const data = (await response.json()) as {
    result: string
    time_last_update_utc: string
    rates: Record<string, number>
  }

  if (data.result !== 'success') {
    throw new Error('Exchange rate fallback returned an error')
  }

  const fromRate = data.rates[from]
  const toRate = data.rates[to]
  if (fromRate == null || toRate == null) {
    throw new Error(`No fallback rate for ${from} → ${to}`)
  }

  return {
    rate: toRate / fromRate,
    date: data.time_last_update_utc.slice(0, 10),
    source: 'exchangerate-api',
  }
}

export function convertAmount(amount: number, rate: number): number {
  return amount * rate
}

export function rateSourceLabel(source: ExchangeRateQuote['source']): string {
  return source === 'frankfurter' ? 'Frankfurter' : 'ExchangeRate-API'
}
