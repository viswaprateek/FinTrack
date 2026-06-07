import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useApiClient, budgetsApi, categoriesApi, transactionsApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
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
import type { GeminiTransactionPayload, Message, ParsedTransaction } from './assistant.types'

declare global {
  interface Window {
    SpeechRecognition?: new () => any
    webkitSpeechRecognition?: new () => any
  }
}

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

const SYSTEM_PROMPT = `You are a smart financial assistant for a budgeting app.

The user will give you a bank SMS, UPI notification, voice transcription,
or natural language message about a financial transaction.

Extract the following fields and return ONLY a JSON object, nothing else:
{
  "type": "expense" | "income" | "unknown",
  "amount": number | null,
  "currency": "INR" | "USD" | ...,
  "date": "YYYY-MM-DD" | null,      // default to today if not mentioned
  "description": string | null,      // merchant or purpose
  "account": string | null,          // bank/card if mentioned
  "category_suggestion": string | null, // suggest from: Groceries, Dining,
                                        // Transport, Subscriptions, Health,
                                        // Shopping, Rent, Utilities,
                                        // Entertainment, Salary, Freelance, Other
  "is_reimbursable": boolean,
  "notes": string | null,
  "confidence": "high" | "medium" | "low",
  "clarification_needed": string | null  // if something is missing or ambiguous,
                                         // ask ONE question here
}

Rules:
- If date is missing, use today's date
- If amount is missing, set clarification_needed
- If type is unclear, set clarification_needed
- Return ONLY the JSON. No explanation. No markdown. No backticks.`

const IMAGE_INSTRUCTION = 'Extract transaction details from this image.'
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const CONNECTION_ERROR = 'Having trouble connecting. Try again in a moment.'
const PARSE_ERROR = "Sorry, I couldn't understand that. Try rephrasing or uploading a clearer image."
const IMAGE_TOO_LARGE = 'Please upload a smaller image (under 4MB)'
const OFFLINE_ERROR = "You're offline. Reconnect to use the assistant."

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function makeMessage(partial: Omit<Message, 'id' | 'timestamp'>): Message {
  return { id: crypto.randomUUID(), timestamp: Date.now(), ...partial }
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return fenced ? fenced[1].trim() : trimmed
}

function parseGeminiJson(raw: string): GeminiTransactionPayload | null {
  try {
    const cleaned = stripCodeFences(raw)
    const parsed = JSON.parse(cleaned)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as GeminiTransactionPayload
  } catch {
    return null
  }
}

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

async function callGemini(apiKey: string, parts: GeminiPart[]): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  })
  if (!response.ok) {
    throw new TypeError(`Gemini request failed with status ${response.status}`)
  }
  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new TypeError('Gemini response missing text')
  }
  return text
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

interface FollowUpContext {
  rawInput: string
  question: string
}

export function useAssistant() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s.assistant)
  const client = useApiClient()
  const { currency, formatCurrency } = useCurrency()

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const budgetId = budgetsQuery.data?.[0]?.id ?? null

  const categoriesQuery = useQuery({
    queryKey: ['categories', budgetId],
    queryFn: () => categoriesApi.listForBudget(client, budgetId as string),
    enabled: !!budgetId,
  })
  const categories = categoriesQuery.data ?? []

  const followUpRef = useRef<FollowUpContext | null>(null)
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
    (suggestion: string | null): number | null => {
      if (!suggestion) return null
      const match = categories.find((c) => c.name.toLowerCase() === suggestion.toLowerCase())
      return match ? Number(match.id) : null
    },
    [categories],
  )

  const handleParsedPayload = useCallback(
    (payload: GeminiTransactionPayload, rawInput: string, spokenInput: boolean) => {
      const transaction = toParsedTransaction(payload, currency || DEFAULT_CURRENCY)
      transaction.category_id = resolveCategoryId(transaction.category_suggestion)

      const needsClarification = transaction.confidence === 'low' || !!transaction.clarification_needed

      if (needsClarification) {
        const question = transaction.clarification_needed ?? 'Could you share a bit more detail about this transaction?'
        followUpRef.current = { rawInput, question }
        const message = makeMessage({ role: 'assistant', content: question })
        dispatch(addMessage(message))
        if (spokenInput) speak(question)
        return
      }

      followUpRef.current = null
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

  const runGeminiText = useCallback(
    async (text: string, spokenInput: boolean) => {
      if (!apiKey) {
        dispatch(setError('Assistant is not configured. Missing Gemini API key.'))
        return
      }
      dispatch(setLoading(true))
      dispatch(setError(null))
      try {
        const contextual = `Today's date is ${todayIso()}.\n\n${text}`
        const raw = await callGemini(apiKey, [{ text: SYSTEM_PROMPT }, { text: contextual }])
        const payload = parseGeminiJson(raw)
        if (!payload) {
          dispatch(addMessage(makeMessage({ role: 'assistant', content: PARSE_ERROR })))
          return
        }
        handleParsedPayload(payload, text, spokenInput)
      } catch {
        const content = navigator.onLine ? CONNECTION_ERROR : OFFLINE_ERROR
        dispatch(setError(content))
        dispatch(addMessage(makeMessage({ role: 'assistant', content })))
      } finally {
        dispatch(setLoading(false))
      }
    },
    [apiKey, dispatch, handleParsedPayload],
  )

  const runGeminiImage = useCallback(
    async (file: File, preview: string) => {
      if (!apiKey) {
        dispatch(setError('Assistant is not configured. Missing Gemini API key.'))
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        dispatch(addMessage(makeMessage({ role: 'assistant', content: IMAGE_TOO_LARGE })))
        return
      }
      dispatch(setLoading(true))
      dispatch(setError(null))
      try {
        const base64 = await fileToBase64(file)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const raw = await callGemini(apiKey, [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: IMAGE_INSTRUCTION },
        ])
        const payload = parseGeminiJson(raw)
        if (!payload) {
          dispatch(addMessage(makeMessage({ role: 'assistant', content: PARSE_ERROR })))
          return
        }
        handleParsedPayload(payload, `[uploaded screenshot: ${preview ? 'image attached' : file.name}]`, false)
      } catch {
        const content = navigator.onLine ? CONNECTION_ERROR : OFFLINE_ERROR
        dispatch(setError(content))
        dispatch(addMessage(makeMessage({ role: 'assistant', content })))
      } finally {
        dispatch(setLoading(false))
      }
    },
    [apiKey, dispatch, handleParsedPayload],
  )

  const sendText = useCallback(
    async (text: string, spokenInput = false) => {
      const trimmed = text.trim()
      if (!trimmed) return

      dispatch(addMessage(makeMessage({ role: 'user', content: trimmed })))

      const followUp = followUpRef.current
      if (followUp) {
        followUpRef.current = null
        const combined = [
          `Original message: "${followUp.rawInput}"`,
          `Assistant asked: "${followUp.question}"`,
          `User's answer: "${trimmed}"`,
          'Now extract the transaction details using all of this context.',
        ].join('\n')
        await runGeminiText(combined, spokenInput)
        return
      }

      await runGeminiText(trimmed, spokenInput)
    },
    [dispatch, runGeminiText],
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
      dispatch(addMessage(makeMessage({ role: 'user', content: 'Uploaded an image', imagePreview: previewUrl })))
      await runGeminiImage(file, previewUrl)
    },
    [dispatch, runGeminiImage],
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
      if (!budgetId) {
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
          budget_id: budgetId,
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
    [budgetId, client, dispatch, speak],
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
