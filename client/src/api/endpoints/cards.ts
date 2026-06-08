import type { AxiosInstance } from 'axios'
import type { CardBrand, CardTheme, CardTransaction, CreditCard } from '../../types'

export interface CreditCardCreateInput {
  label: string
  cardholder_name: string
  last_four: string
  brand?: CardBrand
  theme?: CardTheme
  credit_limit: number
  current_balance?: number
  expiry_month: number
  expiry_year: number
}

export interface CreditCardUpdateInput {
  label?: string
  cardholder_name?: string
  last_four?: string
  brand?: CardBrand
  theme?: CardTheme
  credit_limit?: number
  current_balance?: number
  expiry_month?: number
  expiry_year?: number
  is_active?: boolean
}

export interface CardTransactionInput {
  description: string
  amount: number
  category?: string | null
  transacted_at?: string | null
}

function parseCard(card: CreditCard): CreditCard {
  return {
    ...card,
    creditLimit: Number(card.creditLimit),
    currentBalance: Number(card.currentBalance),
    availableCredit: Number(card.availableCredit),
    utilizationPercent: Number(card.utilizationPercent),
  }
}

function parseTransaction(txn: CardTransaction): CardTransaction {
  return {
    ...txn,
    amount: Number(txn.amount),
  }
}

export const cardsApi = {
  list: (client: AxiosInstance) =>
    client.get<CreditCard[]>('/api/cards').then((res) => res.data.map(parseCard)),
  get: (client: AxiosInstance, id: string) =>
    client.get<CreditCard>(`/api/cards/${id}`).then((res) => parseCard(res.data)),
  create: (client: AxiosInstance, payload: CreditCardCreateInput) =>
    client.post<CreditCard>('/api/cards', payload).then((res) => parseCard(res.data)),
  update: (client: AxiosInstance, id: string, payload: CreditCardUpdateInput) =>
    client.patch<CreditCard>(`/api/cards/${id}`, payload).then((res) => parseCard(res.data)),
  remove: (client: AxiosInstance, id: string) =>
    client.delete(`/api/cards/${id}`).then(() => undefined),
  seedDemo: (client: AxiosInstance) =>
    client.post<CreditCard[]>('/api/cards/seed-demo').then((res) => res.data.map(parseCard)),
  listTransactions: (client: AxiosInstance, limit?: number) =>
    client
      .get<CardTransaction[]>('/api/cards/transactions', { params: limit ? { limit } : undefined })
      .then((res) => res.data.map(parseTransaction)),
  listCardTransactions: (client: AxiosInstance, cardId: string) =>
    client
      .get<CardTransaction[]>(`/api/cards/${cardId}/transactions`)
      .then((res) => res.data.map(parseTransaction)),
  addTransaction: (client: AxiosInstance, cardId: string, payload: CardTransactionInput) =>
    client.post<CreditCard>(`/api/cards/${cardId}/transactions`, payload).then((res) => parseCard(res.data)),
  payBalance: (client: AxiosInstance, cardId: string) =>
    client.post<CreditCard>(`/api/cards/${cardId}/pay`).then((res) => parseCard(res.data)),
}
