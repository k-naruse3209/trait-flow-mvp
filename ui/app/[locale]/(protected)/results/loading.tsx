import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Simple skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

export default function ResultsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-80 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Assessment Overview Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Radar Chart Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          
          {/* Radar Chart Placeholder */}
          <div className="h-80 sm:h-96 bg-muted/30 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto animate-pulse" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>

          {/* Score Details Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>

          {/* Scale Information Skeleton */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
        </CardContent>
      </Card>

      {/* Score Summary Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Normalized Scores */}
            <div>
              <Skeleton className="h-5 w-48 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* T-Scores */}
            <div>
              <Skeleton className="h-5 w-44 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Interpretation Skeleton */}
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        {/* Big Five Overview Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-3 w-full max-w-2xl" />
          </CardContent>
        </Card>

        {/* Individual Trait Skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <div className="flex items-center gap-4 mb-3">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="w-24 ml-4">
                  <Skeleton className="h-2 w-full rounded-full mb-1" />
                  <Skeleton className="h-3 w-8 mx-auto" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-5 w-28 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}