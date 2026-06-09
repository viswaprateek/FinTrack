import { useTheme } from '../contexts/ThemeContext'

const sharedElements = {
  rootBox: 'mx-auto',
  formButtonPrimary: 'bg-accent hover:bg-accent-hover',
  footerActionLink: 'text-accent hover:text-accent-hover',
}

export const clerkAppearanceLight = {
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#ffffff',
    colorText: '#030712',
    colorTextSecondary: '#52525b',
    colorInputBackground: '#ffffff',
    colorInputText: '#111827',
    borderRadius: '0.5rem',
  },
  elements: {
    ...sharedElements,
    card: 'bg-surface-solid border border-border shadow-sm shadow-black/5',
  },
}

export const clerkAppearanceDark = {
  variables: {
    colorPrimary: '#7b89f4',
    colorBackground: '#151929',
    colorText: '#ffffff',
    colorTextSecondary: '#9ca3af',
    colorInputBackground: '#1a1f35',
    colorInputText: '#e5e7eb',
    borderRadius: '0.5rem',
  },
  elements: {
    ...sharedElements,
    card: 'bg-surface-solid border border-border shadow-none',
  },
}

/** @deprecated Use useClerkAppearance() for theme-aware Clerk styling */
export const clerkAppearance = clerkAppearanceLight

export function useClerkAppearance() {
  const { theme } = useTheme()
  return theme === 'dark' ? clerkAppearanceDark : clerkAppearanceLight
}
