import { configureStore } from '@reduxjs/toolkit'
import { assistantReducer } from '../components/assistant/assistantSlice'

export const store = configureStore({
  reducer: {
    assistant: assistantReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
