'use client'

import { CheckinCard } from "@/components/CheckinCard";
import { CheckinHistory } from "@/components/CheckinHistory";
import { MoodAnalytics } from "@/components/MoodAnalytics";
import { DashboardInterventions } from "@/components/DashboardInterventions";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useInterventions } from "@/hooks/useInterventions";
import { useCheckinHistory } from "@/hooks/useCheckinHistory";
import { useMoodAnalytics } from "@/hooks/useMoodAnalytics";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/components/translation-provider";

// Loading component for check-in sections
function CheckinSectionSkeleton() {
  const t = useTranslations();
  
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
          {t('dashboard.loading')}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const interventionsHook = useInterventions()
  const checkinsHook = useCheckinHistory(5, false) // 5 items, no pagination for dashboard
  const analyticsHook = useMoodAnalytics()

  return (
    <DashboardProvider
      refreshInterventions={interventionsHook.refreshInterventions}
      refreshCheckins={checkinsHook.refreshCheckins}
      refreshAnalytics={analyticsHook.refreshAnalytics}
    >
      {/* Check-in Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Check-in Card */}
        <div className="lg:col-span-1">
          <Suspense fallback={<CheckinSectionSkeleton />}>
            <CheckinCard
              pendingFeedbackCount={interventionsHook.pendingFeedbackCount}
              pendingFeedbackIntervention={interventionsHook.pendingFeedbackIntervention}
              onFeedbackSubmitted={interventionsHook.refreshInterventions}
            />
          </Suspense>
        </div>

        {/* Mood Analytics */}
        <div className="lg:col-span-1">
          <Suspense fallback={<CheckinSectionSkeleton />}>
            <MoodAnalytics 
              analytics={analyticsHook.analytics}
              loading={analyticsHook.loading}
              error={analyticsHook.error}
              refreshAnalytics={analyticsHook.refreshAnalytics}
            />
          </Suspense>
        </div>
      </div>

      {/* Interventions Section */}
      <div className="w-full">
        <Suspense fallback={<CheckinSectionSkeleton />}>
          <DashboardInterventions 
            interventions={interventionsHook.interventions}
            loading={interventionsHook.loading}
            error={interventionsHook.error}
            refreshInterventions={interventionsHook.refreshInterventions}
          />
        </Suspense>
      </div>

      {/* Check-in History */}
      <div className="w-full">
        <Suspense fallback={<CheckinSectionSkeleton />}>
          <CheckinHistory 
            checkins={checkinsHook.checkins}
            loading={checkinsHook.loading}
            error={checkinsHook.error}
            totalCount={checkinsHook.totalCount}
            currentPage={checkinsHook.currentPage}
            hasMore={checkinsHook.hasMore}
            onPreviousPage={checkinsHook.handlePreviousPage}
            onNextPage={checkinsHook.handleNextPage}
            limit={5}
            showPagination={false}
          />
        </Suspense>
      </div>
    </DashboardProvider>
  )
}