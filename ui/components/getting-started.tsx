"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/components/translation-provider";

export function GettingStarted() {
  const t = useTranslations();
  return (
    <Card className="w-full">
      <CardHeader className="px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl">{t('gettingStarted.title', 'Getting Started')}</CardTitle>
        <CardDescription className="text-sm md:text-base">
          {t('gettingStarted.description', 'Follow these steps to unlock all features and start your AI coaching journey')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm md:text-base font-medium flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base md:text-lg leading-tight mb-2">
                {t('gettingStarted.step1.title', 'Complete your personality assessment to unlock personalized features')}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('gettingStarted.step1.description', 'Take the TIPI assessment to get personalized AI coaching based on your personality.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-sm md:text-base font-medium flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base md:text-lg leading-tight mb-2">
                {t('gettingStarted.step2.title', 'Start daily check-ins to receive AI coaching')}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('gettingStarted.step2.description', 'Share your daily experiences and receive personalized coaching insights.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm md:text-base font-medium flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base md:text-lg leading-tight mb-2">
                {t('gettingStarted.step3.title', 'Review and rate your coaching messages')}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('gettingStarted.step3.description', 'Help improve your AI coach by providing feedback on the messages you receive.')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}