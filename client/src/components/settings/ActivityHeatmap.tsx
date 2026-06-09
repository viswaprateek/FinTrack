import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiClient, activityApi } from '../../api'
import { buildHeatmapWeeks, buildMonthLabels, LEVEL_COLORS } from '../../lib/activityHeatmap'
import { cn } from '../../lib/utils'

export function ActivityHeatmap() {
  const client = useApiClient()

  const activityQuery = useQuery({
    queryKey: ['activity'],
    queryFn: () => activityApi.get(client),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const weeks = useMemo(
    () => buildHeatmapWeeks(activityQuery.data?.days ?? []),
    [activityQuery.data?.days],
  )
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks])
  const stats = activityQuery.data?.stats

  if (activityQuery.isLoading) {
    return <p className="text-sm text-muted">Loading activity…</p>
  }

  if (activityQuery.isError) {
    return <p className="text-sm text-red-400">Could not load activity.</p>
  }

  return (
    <div className="space-y-4">
      {stats && (
        <p className="text-sm text-muted-fg">
          <span className="font-medium text-subtle">{stats.totalExpenses}</span>
          {' '}expense{stats.totalExpenses === 1 ? '' : 's'} logged across{' '}
          <span className="font-medium text-subtle">{stats.activeDays}</span>
          {' '}day{stats.activeDays === 1 ? '' : 's'} in the last year
          {stats.currentStreak > 0 && (
            <>
              {' '}· <span className="font-medium text-emerald-400">{stats.currentStreak}-day</span> streak
            </>
          )}
        </p>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-0 flex-col gap-1">
          <div className="relative h-4" style={{ width: weeks.length * 14 }}>
            {monthLabels.map(({ label, weekIndex }) => (
              <span
                key={`${label}-${weekIndex}`}
                className="absolute text-[10px] text-muted"
                style={{ left: weekIndex * 14 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.days.map((cell, di) =>
                  cell ? (
                    <div
                      key={cell.date}
                      title={tooltipText(cell.date, cell.count)}
                      className={cn('h-[11px] w-[11px] rounded-sm', LEVEL_COLORS[cell.level])}
                    />
                  ) : (
                    <span key={`empty-${wi}-${di}`} className="h-[11px] w-[11px]" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <span key={i} className={cn('h-[11px] w-[11px] rounded-sm', color)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function tooltipText(iso: string, count: number) {
  const date = new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (count === 0) return `No expenses on ${date}`
  return `${count} expense${count === 1 ? '' : 's'} on ${date}`
}
