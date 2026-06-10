import { Card, CardContent } from '../ui/Card'

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-input/80 ${className ?? ''}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Bone className="h-8 w-48 max-w-full" />
        <div className="flex gap-2">
          <Bone className="h-10 w-28" />
          <Bone className="h-10 w-32" />
        </div>
      </div>

      <div className="-mx-4 flex gap-3 overflow-hidden px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-24 min-w-[140px] shrink-0 lg:min-w-0" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Bone className="h-5 w-40" />
            <Bone className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Bone className="h-5 w-36" />
            <Bone className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Bone className="h-5 w-44" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
