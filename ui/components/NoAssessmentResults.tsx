'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BarChart3, Users, Target } from "lucide-react";
import { useTranslations, useLocale } from "@/components/translation-provider";

export function NoAssessmentResults() {
  const t = useTranslations();
  const locale = useLocale();
  
  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Main Call-to-Action Card */}
      <Card className="text-center">
        <CardHeader className="pb-4 px-4 md:px-6">
          <div className="mx-auto w-12 md:w-16 h-12 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-6 md:w-8 h-6 md:h-8 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">{t('results.noResults.mainTitle')}</CardTitle>
          <CardDescription className="text-base md:text-lg">
            {t('results.noResults.mainDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t('results.noResults.description')}
          </p>
          
          <Button asChild size="lg" className="px-6 md:px-8 w-full sm:w-auto min-h-[44px]">
            <Link href={`/${locale}/assessment`}>
              {t('results.noResults.takeAssessment')}
            </Link>
          </Button>
          
          <p className="text-xs md:text-sm text-muted-foreground">
            {t('results.noResults.quickInfo')}
          </p>
        </CardContent>
      </Card>

      {/* What You&apos;ll Discover */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">{t('results.noResults.discover.title')}</CardTitle>
          <CardDescription className="text-sm md:text-base">
            {t('results.noResults.discover.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-600">{t('results.noResults.discover.extraversion.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.extraversion.description')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-600">{t('results.noResults.discover.agreeableness.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.agreeableness.description')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-600">{t('results.noResults.discover.conscientiousness.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.conscientiousness.description')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-600">{t('results.noResults.discover.neuroticism.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.neuroticism.description')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-600">{t('results.noResults.discover.openness.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.openness.description')}
                </p>
              </div>
            </div>

            <div className="space-y-3 md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-600">{t('results.noResults.discover.analysis.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('results.noResults.discover.analysis.description')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">{t('results.noResults.howItWorks.title')}</CardTitle>
          <CardDescription className="text-sm md:text-base">
            {t('results.noResults.howItWorks.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">{t('results.noResults.howItWorks.step1.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('results.noResults.howItWorks.step1.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">{t('results.noResults.howItWorks.step2.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('results.noResults.howItWorks.step2.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">{t('results.noResults.howItWorks.step3.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('results.noResults.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <div className="text-center py-6 md:py-8">
        <Button asChild size="lg" className="px-6 md:px-8 w-full sm:w-auto min-h-[44px]">
          <Link href={`/${locale}/assessment`}>
            {t('results.noResults.finalCta')}
          </Link>
        </Button>
        <p className="text-xs md:text-sm text-muted-foreground mt-3">
          {t('results.noResults.joinUsers')}
        </p>
      </div>
    </div>
  );
}