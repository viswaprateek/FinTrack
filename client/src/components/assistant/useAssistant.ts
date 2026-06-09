import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { assistantApi, categoriesApi, transactionsApi, useApiClient } from '../../api'
import type { ChatMessageInput } from '../../api/endpoints/assistant'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { budgetForDate } from '../../lib/budgets'
import { DEFAULT_CURRENCY } from '../../lib/currencies'
import {
  addMessage,
  clearPendingTransaction,
  setError,
  setListening,
  setLoading,
  setOpen,
  setPendingTransaction,
  setSpeaking,
  toggleOpen,
  updatePendingTransaction,
} from './assistantSlice'
import type { AssistantChatResponse, GeminiTransactionPayload, Message, ParsedTransaction } from './assistant.types'

declare global {
  interface Window {
    SpeechRecognition?: new () => any
    webkitSpeechRecognition?: new () => any
  }
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const CONNECTION_ERROR = 'Having trouble connecting. Try again in a moment.'
const IMAGE_TOO_LARGE = 'Please upload a smaller image (under 4MB)'
const OFFLINE_ERROR = "You're offline. Reconnect to use the assistant."
const NOT_CONFIGURED = 'Assistant is not configured on the server.'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function makeMessage(partial: Omit<Message, 'id' | 'timestamp'>): Message {
  return { id: crypto.randomUUID(), timestamp: Date.now(), ...partial }
}

function toChatMessages(messages: Message[]): ChatMessageInput[] {
  return messages.map((m) => ({ role: m.role, content: m.content }))
}

function toParsedTransaction(payload: GeminiTransactionPayload, defaultCurrency: string): ParsedTransaction {
  return {
    type: payload.type ?? 'unknown',
    amount: payload.amount ?? null,
    currency: payload.currency ?? defaultCurrency,
    date: payload.date ?? todayIso(),
    description: payload.description ?? null,
    account: payload.account ?? null,
    category_suggestion: payload.category_suggestion ?? null,
    category_id: null,
    is_reimbursable: payload.is_reimbursable ?? false,
    notes: payload.notes ?? null,
    confidence: payload.confidence ?? 'low',
    clarification_needed: payload.clarification_needed ?? null,
  }
}

function summarize(transaction: ParsedTransaction, formatCurrency: (amount: number) => string): string {
  const amountLabel = transaction.amount != null ? formatCurrency(transaction.amount) : 'an unknown amount'
  const verb = transaction.type === 'income' ? 'received' : 'spent'
  const description = transaction.description ? ` on ${transaction.description}` : ''
  return `Looks like you ${verb} ${amountLabel}${description}. Review the details below and confirm.`
}

let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = globalThis.speechSynthesis?.getVoices?.() ?? []
  cachedVoice =
    voices.find((v) => v.name === 'Google US English') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0] ??
    null
  return cachedVoice
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function assistantErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 503) {
    return NOT_CONFIGURED
  }
  return navigator.onLine ? CONNECTION_ERROR : OFFLINE_ERROR
}

export function useAssistant() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s.assistant)
  const client = useApiClient()
  const { currency, formatCurrency } = useCurrency()

  const queryClient = useQueryClient()
  const { budgets, currentBudget } = useBudgetPeriod()

  const categoryBudgetId = useMemo(() => {
    const date = state.pendingTransaction?.date
    if (date) {
      return budgetForDate(budgets, date)?.id ?? currentBudget?.id ?? null
    }
    return currentBudget?.id ?? null
  }, [state.pendingTransaction?.date, budgets, currentBudget])

  const categoriesQuery = useQuery({
    queryKey: ['categories', categoryBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, categoryBudgetId as string),
    enabled: !!categoryBudgetId,
  })
  const categories = categoriesQuery.data ?? []

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const micSupported = useMemo(
    () => typeof globalThis.window !== 'undefined' && !!(globalThis.window.SpeechRecognition || (globalThis.window as any).webkitSpeechRecognition),
    [],
  )

  const speak = useCallback(
    (text: string) => {
      if (!globalThis.speechSynthesis) return
      globalThis.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.lang = 'en-US'
      const voice = pickVoice()
      if (voice) utterance.voice = voice
      utterance.onstart = () => dispatch(setSpeaking(true))
      utterance.onend = () => dispatch(setSpeaking(false))
      utterance.onerror = () => dispatch(setSpeaking(false))
      globalThis.speechSynthesis.speak(utterance)
    },
    [dispatch],
  )

  const resolveCategoryId = useCallback(
    async (suggestion: string | null, date: string): Promise<number | null> => {
      if (!suggestion) return null
      const targetBudget = budgetForDate(budgets, date) ?? currentBudget
      if (!targetBudget) return null
      const targetCategories = await queryClient.fetchQuery({
        queryKey: ['categories', targetBudget.id],
        queryFn: () => categoriesApi.listForBudget(client, targetBudget.id),
      })
      const match = targetCategories.find((c) => c.name.toLowerCase() === suggestion.toLowerCase())
      return match ? Number(match.id) : null
    },
    [budgets, currentBudget, client, queryClient],
  )

  const handleTransactionPayload = useCallback(
    async (payload: GeminiTransactionPayload, spokenInput: boolean) => {
      const transaction = toParsedTransaction(payload, currency || DEFAULT_CURRENCY)
      transaction.category_id = await resolveCategoryId(transaction.category_suggestion, transaction.date)

      const needsClarification = transaction.confidence === 'low' || !!transaction.clarification_needed

      if (needsClarification) {
        const question = transaction.clarification_needed ?? 'Could you share a bit more detail about this transaction?'
        const message = makeMessage({ role: 'assistant', content: question })
        dispatch(addMessage(message))
        if (spokenInput) speak(question)
        return
      }

      dispatch(setPendingTransaction(transaction))

      const warning =
        transaction.confidence === 'medium'
          ? "Please review — I'm not fully confident about these details. "
          : ''
      const content = `${warning}${summarize(transaction, formatCurrency)}`
      const message = makeMessage({ role: 'assistant', content, pendingTransaction: transaction })
      dispatch(addMessage(message))
      if (spokenInput) speak(content)
    },
    [currency, dispatch, formatCurrency, resolveCategoryId, speak],
  )

  const handleChatResponse = useCallback(
    async (response: AssistantChatResponse, spokenInput: boolean) => {
      if (response.kind === 'answer' || response.kind === 'clarification') {
        const message = makeMessage({ role: 'assistant', content: response.message })
        dispatch(addMessage(message))
        if (spokenInput) speak(response.message)
        return
      }
      await handleTransactionPayload(response.transaction, spokenInput)
    },
    [dispatch, handleTransactionPayload, speak],
  )

  const runAssistant = useCallback(
    async (
      messages: Message[],
      spokenInput: boolean,
      image?: { base64: string; mimeType: 'image/jpeg' | 'image/png' },
    ) => {
      dispatch(setLoading(true))
      dispatch(setError(null))
      try {
        const response = await assistantApi.chat(client, {
          messages: toChatMessages(messages),
          image_base64: image?.base64,
          image_mime_type: image?.mimeType,
        })
        await handleChatResponse(response, spokenInput)
      } catch (error) {
        const content = assistantErrorMessage(error)
        dispatch(setError(content))
        dispatch(addMessage(makeMessage({ role: 'assistant', content })))
      } finally {
        dispatch(setLoading(false))
      }
    },
    [client, dispatch, handleChatResponse],
  )

  const sendText = useCallback(
    async (text: string, spokenInput = false) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMessage = makeMessage({ role: 'user', content: trimmed })
      dispatch(addMessage(userMessage))
      await runAssistant([...state.messages, userMessage], spokenInput)
    },
    [dispatch, runAssistant, state.messages],
  )

  const sendImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > MAX_IMAGE_BYTES) {
        dispatch(addMessage(makeMessage({ role: 'user', content: 'Uploaded an image' })))
        dispatch(addMessage(makeMessage({ role: 'assistant', content: IMAGE_TOO_LARGE })))
        return
      }
      const preview = await fileToBase64(file)
      const previewUrl = `data:${file.type};base64,${preview}`
      const userMessage = makeMessage({
        role: 'user',
        content: 'Uploaded an image',
        imagePreview: previewUrl,
      })
      dispatch(addMessage(userMessage))
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      await runAssistant([...state.messages, userMessage], false, { base64: preview, mimeType })
    },
    [dispatch, runAssistant, state.messages],
  )

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    recognitionRef.current?.stop?.()
  }, [])

  const startListening = useCallback(
    (onTranscript: (text: string) => void) => {
      if (!micSupported) return
      const SpeechRecognitionCtor = globalThis.window.SpeechRecognition || (globalThis.window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = true
      recognitionRef.current = recognition

      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => recognition.stop(), 3000)
      }

      recognition.onresult = (event: any) => {
        resetSilenceTimer()
        let transcript = ''
        for (let i = 0; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript
        }
        onTranscript(transcript)
      }
      recognition.onerror = () => {
        dispatch(setListening(false))
      }
      recognition.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        dispatch(setListening(false))
      }

      dispatch(setListening(true))
      resetSilenceTimer()
      recognition.start()
    },
    [dispatch, micSupported],
  )

  const updateTransaction = useCallback(
    (patch: Partial<ParsedTransaction>) => dispatch(updatePendingTransaction(patch)),
    [dispatch],
  )

  const dismissTransaction = useCallback(() => dispatch(clearPendingTransaction()), [dispatch])

  const confirmTransaction = useCallback(
    async (transaction: ParsedTransaction) => {
      const targetBudget = budgetForDate(budgets, transaction.date) ?? currentBudget
      if (!targetBudget) {
        dispatch(setError('No budget found to add this transaction to.'))
        return
      }
      if (transaction.amount == null) {
        dispatch(setError('Please enter an amount before adding the transaction.'))
        return
      }
      dispatch(setLoading(true))
      dispatch(setError(null))
      try {
        await transactionsApi.create(client, {
          budget_id: targetBudget.id,
          category_id: transaction.category_id != null ? String(transaction.category_id) : null,
          date: transaction.date,
          description: transaction.description ?? 'Untitled transaction',
          amount: transaction.amount,
          type: transaction.type === 'income' ? 'income' : 'expense',
          account: transaction.account,
          reimbursable: transaction.is_reimbursable ? 'pending' : 'none',
          notes: transaction.notes,
          source: 'assistant',
        })
        dispatch(clearPendingTransaction())
        const content = '✅ Transaction added successfully.'
        dispatch(addMessage(makeMessage({ role: 'assistant', content })))
        speak('Transaction added successfully.')
      } catch {
        dispatch(setError('Could not add the transaction. Please try again.'))
      } finally {
        dispatch(setLoading(false))
      }
    },
    [budgets, currentBudget, client, dispatch, speak],
  )

  useEffect(() => {
    return () => {
      stopListening()
      globalThis.speechSynthesis?.cancel()
    }
  }, [stopListening])

  return {
    ...state,
    categories,
    micSupported,
    open: () => dispatch(setOpen(true)),
    close: () => dispatch(setOpen(false)),
    toggle: () => dispatch(toggleOpen()),
    sendText,
    sendImage,
    startListening,
    stopListening,
    speak,
    confirmTransaction,
    updateTransaction,
    dismissTransaction,
  }
}
