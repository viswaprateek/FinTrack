import type { ActivityDay } from '../api/endpoints/activity'

export interface HeatmapCell {
  date: string
  count: number
  level: number
}

export interface HeatmapWeek {
  days: (HeatmapCell | null)[]
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfWeekSunday(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

/** Build LeetCode-style week columns (Sun–Sat rows) for the last ~53 weeks. */
export function buildHeatmapWeeks(days: ActivityDay[], end = new Date()): HeatmapWeek[] {
  const countMap = new Map(days.map((d) => [d.date.slice(0, 10), d]))

  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 364)

  const gridStart = startOfWeekSunday(startDate)
  const weeks: HeatmapWeek[] = []

  let cursor = new Date(gridStart)
  while (cursor <= endDate) {
    const weekDays: (HeatmapCell | null)[] = []
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(cursor)
      cellDate.setDate(cursor.getDate() + row)
      if (cellDate < startDate || cellDate > endDate) {
        weekDays.push(null)
        continue
      }
      const iso = toIso(cellDate)
      const entry = countMap.get(iso)
      weekDays.push({
        date: iso,
        count: entry?.count ?? 0,
        level: entry?.level ?? 0,
      })
    }
    weeks.push({ days: weekDays })
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

/** Month labels aligned to week columns (show when month changes). */
export function buildMonthLabels(weeks: HeatmapWeek[]): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1

  weeks.forEach((week, weekIndex) => {
    const first = week.days.find((d) => d !== null)
    if (!first) return
    const month = new Date(first.date + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      labels.push({
        label: new Date(first.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }),
        weekIndex,
      })
      lastMonth = month
    }
  })

  return labels
}

export const LEVEL_COLORS = [
  'bg-input border border-border-muted/80',
  'bg-emerald-950/80 border border-emerald-900/50',
  'bg-emerald-800/80',
  'bg-emerald-600/90',
  'bg-accent',
] as const
