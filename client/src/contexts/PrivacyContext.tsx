import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'fintrack-privacy-mode'

interface PrivacyContextValue {
  privacyMode: boolean
  setPrivacyMode: (enabled: boolean) => void
  togglePrivacyMode: () => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

function readStoredPrivacyMode(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyModeState] = useState(() => readStoredPrivacyMode())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(privacyMode))
  }, [privacyMode])

  const setPrivacyMode = useCallback((enabled: boolean) => {
    setPrivacyModeState(enabled)
  }, [])

  const togglePrivacyMode = useCallback(() => {
    setPrivacyModeState((current) => !current)
  }, [])

  const value = useMemo(
    () => ({ privacyMode, setPrivacyMode, togglePrivacyMode }),
    [privacyMode, setPrivacyMode, togglePrivacyMode],
  )

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

export function usePrivacy(): PrivacyContextValue {
  const context = useContext(PrivacyContext)
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}
