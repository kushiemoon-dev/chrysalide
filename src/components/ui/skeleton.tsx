import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'card'
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted animate-pulse',
        variant === 'default' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'card' && 'rounded-xl',
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
export function SkeletonCard() {
  return (
    <div className="bg-card border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border-border space-y-2 rounded-xl border p-4">
          <Skeleton variant="text" className="h-8 w-12" />
          <Skeleton variant="text" className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonMedicationCard() {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="space-y-2">
            <Skeleton variant="text" className="w-32" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        </div>
        <Skeleton variant="default" className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <Skeleton variant="text" className="mb-4 h-5 w-40" />
      <Skeleton variant="default" className="h-48 w-full rounded-lg" />
    </div>
  )
}

export function SkeletonTimeline() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" className="h-5 w-24" />
      <div className="border-muted space-y-3 border-l-2 pl-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton variant="circular" className="-ml-[7px] h-3 w-3" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-7 w-48" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Content */}
      <SkeletonList count={3} />
    </div>
  )
}
