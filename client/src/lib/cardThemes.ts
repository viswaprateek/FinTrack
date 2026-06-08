import type { CardBrand, CardTheme } from '../types'

export interface CardThemeStyle {
  gradient: string
  text: string
  chip: string
  accent: string
}

export const CARD_THEMES: Record<CardTheme, CardThemeStyle> = {
  lime: {
    gradient: 'from-lime-300 via-lime-400 to-lime-500',
    text: 'text-slate-900',
    chip: 'bg-yellow-200/80',
    accent: 'text-slate-800/70',
  },
  yellow: {
    gradient: 'from-yellow-300 via-amber-300 to-yellow-400',
    text: 'text-slate-900',
    chip: 'bg-amber-100/90',
    accent: 'text-slate-800/70',
  },
  navy: {
    gradient: 'from-slate-800 via-slate-900 to-black',
    text: 'text-white',
    chip: 'bg-white/20',
    accent: 'text-white/60',
  },
  emerald: {
    gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    text: 'text-white',
    chip: 'bg-white/25',
    accent: 'text-white/70',
  },
  violet: {
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    text: 'text-white',
    chip: 'bg-white/25',
    accent: 'text-white/70',
  },
}

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'AMEX',
  paypal: 'PayPal',
}

export const THEME_OPTIONS: CardTheme[] = ['lime', 'yellow', 'navy', 'emerald', 'violet']
export const BRAND_OPTIONS: CardBrand[] = ['visa', 'mastercard', 'amex', 'paypal']
