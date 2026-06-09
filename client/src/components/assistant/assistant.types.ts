export type TransactionTypeGuess = 'expense' | 'income' | 'unknown'
export type Confidence = 'high' | 'medium' | 'low'

export interface ParsedTransaction {
  type: TransactionTypeGuess
  amount: number | null
  currency: string
  date: string
  description: string | null
  account: string | null
  category_suggestion: string | null
  category_id: number | null
  is_reimbursable: boolean
  notes: string | null
  confidence: Confidence
  clarification_needed: string | null
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imagePreview?: string
  timestamp: number
  pendingTransaction?: ParsedTransaction | null
}

export interface AssistantState {
  isOpen: boolean
  messages: Message[]
  isLoading: boolean
  isListening: boolean
  isSpeaking: boolean
  pendingTransaction: ParsedTransaction | null
  error: string | null
}

export interface GeminiTransactionPayload {
  type: TransactionTypeGuess
  amount: number | null
  currency: string
  date: string | null
  description: string | null
  account: string | null
  category_suggestion: string | null
  is_reimbursable: boolean
  notes: string | null
  confidence: Confidence
  clarification_needed: string | null
}

export type AssistantChatResponse =
  | { kind: 'transaction'; transaction: GeminiTransactionPayload }
  | { kind: 'answer'; message: string }
  | { kind: 'clarification'; message: string }
