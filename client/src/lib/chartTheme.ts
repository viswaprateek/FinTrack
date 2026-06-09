import { useTheme } from '../contexts/ThemeContext'

const light = {
  grid: '#f3f4f6',
  axis: '#71717a',
  legend: '#52525b',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#030712',
  accent: '#6366f1',
  accentFill: 'rgb(99 102 241 / 0.15)',
  secondary: '#3b82f6',
  success: '#10b981',
}

const dark = {
  grid: '#252a3d',
  axis: '#6b7280',
  legend: '#9ca3af',
  tooltipBg: '#151929',
  tooltipBorder: '#2d3348',
  tooltipText: '#ffffff',
  accent: '#7b89f4',
  accentFill: 'rgb(123 137 244 / 0.22)',
  secondary: '#60a5fa',
  success: '#34d399',
}

export type ChartTheme = typeof light

export function useChartTheme(): ChartTheme {
  const { theme } = useTheme()
  return theme === 'dark' ? dark : light
}

export const CHART_COLORS = [
  '#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#10b981', '#f97316', '#ec4899', '#14b8a6',
]
