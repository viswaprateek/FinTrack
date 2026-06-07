export interface ExchangeRateQuote {
  rate: number
  date: string
  source: 'frankfurter' | 'exchangerate-api'
}

const FRANKFURTER_API = 'https://api.frankfurter.dev/v1'
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

async function fetchFromFrankfurter(from: string, to: string): Promise<ExchangeRateQuote> {
  const response = await fetch(
    `${FRANKFURTER_API}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  )
  if (!response.ok) {
    throw new Error('Frankfurter request failed')
  }

  const data = (await response.json()) as { date: string; rates: Record<string, number> }
  const rate = data.rates[to]
  if (rate == null) {
    throw new Error(`No Frankfurter rate for ${from} → ${to}`)
  }

  return { rate, date: data.date, source: 'frankfurter' }
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
  return source === 'frankfurter' ? 'ECB' : 'ExchangeRate-API'
}
