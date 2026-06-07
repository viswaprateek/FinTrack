import type { UseQueryResult } from '@tanstack/react-query'

type QueryLike = Pick<UseQueryResult<unknown>, 'isLoading'>

/** True when any query is on its first fetch with no cached data yet. */
export function useInitialLoading(queries: QueryLike[]): boolean {
  return queries.some((q) => q.isLoading)
}
