import { useIsFetching } from '@tanstack/react-query'
import { cn } from '../../lib/utils'

export function QueryLoadingBar() {
  const fetching = useIsFetching()
  const active = fetching > 0

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden={!active}
      role="progressbar"
      aria-busy={active}
    >
      <div className={cn('query-loading-bar h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent', active && 'is-active')} />
    </div>
  )
}
