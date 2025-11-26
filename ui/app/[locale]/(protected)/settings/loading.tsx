import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Simple skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 sm:h-9 w-32 sm:w-48 mb-2" />
        <Skeleton className="h-4 sm:h-5 w-64 sm:w-80" />
      </div>

      {/* Settings Layout Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Navigation Skeleton */}
        <div className="md:col-span-1">
          {/* Desktop Navigation Skeleton */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
          
          {/* Mobile Navigation Skeleton */}
          <div className="md:hidden">
            <Card>
              <CardContent className="p-2">
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-20 flex-shrink-0" />
                  <Skeleton className="h-8 w-16 flex-shrink-0" />
                  <Skeleton className="h-8 w-24 flex-shrink-0" />
                  <Skeleton className="h-8 w-18 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-2" />
              <Skeleton className="h-4 w-48 sm:w-64" />
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Form Fields Skeleton */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-2" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-28 mb-2" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 sm:h-4 w-28 sm:w-36 mb-2" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              </div>

              {/* Action Button Skeleton */}
              <div className="flex justify-end pt-2">
                <Skeleton className="h-9 sm:h-10 w-full sm:w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}