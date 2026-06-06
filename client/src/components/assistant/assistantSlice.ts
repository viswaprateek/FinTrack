import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AssistantState, Message, ParsedTransaction } from './assistant.types'

const initialState: AssistantState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  pendingTransaction: null,
  error: null,
}

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    setOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload
    },
    toggleOpen(state) {
      state.isOpen = !state.isOpen
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload)
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setListening(state, action: PayloadAction<boolean>) {
      state.isListening = action.payload
    },
    setSpeaking(state, action: PayloadAction<boolean>) {
      state.isSpeaking = action.payload
    },
    setPendingTransaction(state, action: PayloadAction<ParsedTransaction | null>) {
      state.pendingTransaction = action.payload
    },
    updatePendingTransaction(state, action: PayloadAction<Partial<ParsedTransaction>>) {
      if (state.pendingTransaction) {
        state.pendingTransaction = { ...state.pendingTransaction, ...action.payload }
      }
    },
    clearPendingTransaction(state) {
      state.pendingTransaction = null
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setOpen,
  toggleOpen,
  addMessage,
  setLoading,
  setListening,
  setSpeaking,
  setPendingTransaction,
  updatePendingTransaction,
  clearPendingTransaction,
  setError,
} = assistantSlice.actions

export const assistantReducer = assistantSlice.reducer
