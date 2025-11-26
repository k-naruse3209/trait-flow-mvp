'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TraitRadarChart } from "@/components/TraitRadarChart";
import { ResultsInterpretation } from "@/components/ResultsInterpretation";
import { BigFiveScores } from "@/lib/tipi";
import { useTranslations, useLocale } from "@/components/translation-provider";

interface AssessmentResultData {
  id: string;
  traits_p01: BigFiveScores;
  traits_t: BigFiveScores;
  administered_at: string;
  instrument: string;
}

interface AssessmentResultsProps {
  assessmentData: AssessmentResultData;
}

export function AssessmentResults({ assessmentData }: AssessmentResultsProps) {
  const t = useTranslations();
  const locale = useLocale();
  
  const assessmentDate = new Date(assessmentData.administered_at);
  const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' };
  const formattedDate = assessmentDate.toLocaleDateString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Assessment Metadata */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">{t('results.overview.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('results.overview.completedOn')} {formattedDate}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('results.overview.instrument')}: {assessmentData.instrument.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Link href={`/${locale}/dashboard`}>
                {t('results.overview.returnToDashboard')}
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto min-h-[44px]">
              <Link href={`/${locale}/assessment`}>
                {t('results.overview.retakeAssessment')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Personality Radar Chart */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <TraitRadarChart 
          scores={assessmentData.traits_p01}
          tScores={assessmentData.traits_t}
          title={t('results.chart.title')}
          showTScores={false}
          allowScaleToggle={true}
          compact={false}
        />
      </div>

      {/* Score Summary */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">{t('results.scores.title')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Normalized Scores */}
          <div>
            <h4 className="font-medium mb-3 text-muted-foreground">{t('results.scores.normalized')}</h4>
            <div className="space-y-2">
              {Object.entries(assessmentData.traits_p01).map(([trait, score]) => (
                <div key={trait} className="flex justify-between items-center p-3 bg-muted/50 rounded min-h-[44px]">
                  <span className="font-medium text-sm md:text-base">{t(`results.traits.${trait}`)}</span>
                  <span className="font-semibold text-sm md:text-base">{score.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* T-Scores */}
          <div>
            <h4 className="font-medium mb-3 text-muted-foreground">{t('results.scores.tScores')}</h4>
            <div className="space-y-2">
              {Object.entries(assessmentData.traits_t).map(([trait, score]) => (
                <div key={trait} className="flex justify-between items-center p-3 bg-muted/50 rounded min-h-[44px]">
                  <span className="font-medium text-sm md:text-base">{t(`results.traits.${trait}`)}</span>
                  <span className="font-semibold text-sm md:text-base">{Math.round(score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Interpretation */}
      <ResultsInterpretation 
        scores={assessmentData.traits_p01}
        showTScores={false}
      />
    </div>
  );
}