import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'fintrack-theme'
const LIGHT_DEFAULT_MIGRATION_KEY = 'fintrack-theme-light-default-v1'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  if (!localStorage.getItem(LIGHT_DEFAULT_MIGRATION_KEY)) {
    localStorage.setItem(STORAGE_KEY, 'light')
    localStorage.setItem(LIGHT_DEFAULT_MIGRATION_KEY, '1')
    return 'light'
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
