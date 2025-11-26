'use client'

export function ResultsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-0 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 md:h-10 bg-muted rounded-lg w-3/4"></div>
        <div className="h-4 md:h-5 bg-muted rounded w-1/2"></div>
      </div>

      {/* Assessment Metadata Skeleton */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-11 bg-muted rounded w-full sm:w-40"></div>
            <div className="h-11 bg-muted rounded w-full sm:w-40"></div>
          </div>
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
          <div className="h-72 sm:h-80 md:h-96 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Summary Skeleton */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3">
            <div className="h-5 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Skeleton */}
      <div className="space-y-4 md:space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
                <div className="w-full sm:w-24">
                  <div className="h-2 bg-muted rounded-full"></div>
                  <div className="h-3 bg-muted rounded w-8 mx-auto mt-1"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-muted/50 rounded space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}