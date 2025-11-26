'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTranslations, useLocale } from "@/components/translation-provider";

interface AssessmentResultsErrorProps {
  error?: string;
  onRetry?: () => void;
}

export function AssessmentResultsError({ 
  error = "Failed to load assessment results", 
  onRetry 
}: AssessmentResultsErrorProps) {
  const t = useTranslations();
  const locale = useLocale();
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-4 px-4 md:px-6">
          <div className="mx-auto w-12 md:w-16 h-12 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 md:w-8 h-6 md:h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl md:text-2xl text-red-600">{t('results.error.title')}</CardTitle>
          <CardDescription className="text-base md:text-lg">
            {t('results.error.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-red-800">
              <strong>{t('results.error.errorLabel')}:</strong> {error}
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm md:text-base">
              {t('results.error.description')}
            </p>
            
            <div className="flex flex-col gap-3 justify-center">
              {onRetry && (
                <Button onClick={onRetry} className="flex items-center gap-2 w-full sm:w-auto min-h-[44px]">
                  <RefreshCw className="w-4 h-4" />
                  {t('results.error.tryAgain')}
                </Button>
              )}
              
              <Button asChild variant="outline" className="flex items-center gap-2 w-full sm:w-auto min-h-[44px]">
                <Link href={`/${locale}/dashboard`}>
                  <Home className="w-4 h-4" />
                  {t('results.error.returnToDashboard')}
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full sm:w-auto min-h-[44px]">
                <Link href={`/${locale}/assessment`}>
                  {t('results.error.retakeAssessment')}
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">{t('results.error.troubleshooting.title')}</p>
            <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto text-xs">
              <li>{t('results.error.troubleshooting.refresh')}</li>
              <li>{t('results.error.troubleshooting.connection')}</li>
              <li>{t('results.error.troubleshooting.cache')}</li>
              <li>{t('results.error.troubleshooting.wait')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}