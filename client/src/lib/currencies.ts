export interface CurrencyOption {
  code: string
  label: string
}

/** ISO 4217 codes supported by the backend — keep in sync with server/app/core/constants.py */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)' },
  { code: 'HKD', label: 'Hong Kong Dollar (HKD)' },
  { code: 'SEK', label: 'Swedish Krona (SEK)' },
  { code: 'NOK', label: 'Norwegian Krone (NOK)' },
  { code: 'DKK', label: 'Danish Krone (DKK)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'BRL', label: 'Brazilian Real (BRL)' },
  { code: 'MXN', label: 'Mexican Peso (MXN)' },
  { code: 'KRW', label: 'South Korean Won (KRW)' },
]

export const DEFAULT_CURRENCY = 'USD'

const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CHF: 'de-CH',
  SGD: 'en-SG',
  AED: 'en-AE',
  NZD: 'en-NZ',
  CNY: 'zh-CN',
  HKD: 'en-HK',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  ZAR: 'en-ZA',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  KRW: 'ko-KR',
}

export function formatCurrencyAmount(amount: number, currency = DEFAULT_CURRENCY): string {
  const locale = CURRENCY_LOCALES[currency] ?? 'en-US'
  const isZeroDecimal = currency === 'JPY' || currency === 'KRW'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: isZeroDecimal ? 0 : amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}
