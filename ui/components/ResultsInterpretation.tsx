'use client'

import { BigFiveScores } from "@/lib/tipi";
import { useTranslations } from "@/components/translation-provider";

interface ResultsInterpretationProps {
  scores: BigFiveScores;
  showTScores?: boolean;
}

const traitColors: Record<keyof BigFiveScores, string> = {
  extraversion: "blue",
  agreeableness: "green", 
  conscientiousness: "purple",
  neuroticism: "red",
  openness: "orange"
};

export function ResultsInterpretation({ scores, showTScores = false }: ResultsInterpretationProps) {
  const t = useTranslations();

  const getPercentileInterpretation = (score: number, isNeuroticism: boolean = false): string => {
    // Convert 0-1 scale to approximate percentile
    const percentile = Math.round(score * 100);

    if (isNeuroticism) {
      // For neuroticism, lower scores are generally more positive
      if (percentile >= 80) return t('results.interpretation.levels.neuroticismVeryHigh');
      if (percentile >= 60) return t('results.interpretation.levels.neuroticismHigh');
      if (percentile >= 40) return t('results.interpretation.levels.neuroticismModerate');
      if (percentile >= 20) return t('results.interpretation.levels.neuroticismLow');
      return t('results.interpretation.levels.neuroticismVeryLow');
    } else {
      if (percentile >= 80) return t('results.interpretation.levels.veryHigh');
      if (percentile >= 60) return t('results.interpretation.levels.high');
      if (percentile >= 40) return t('results.interpretation.levels.moderate');
      if (percentile >= 20) return t('results.interpretation.levels.low');
      return t('results.interpretation.levels.veryLow');
    }
  };

  const getScoreInterpretation = (score: number, traitKey: string): string => {
    const percentile = score * 100;

    if (percentile >= 60) {
      return t(`results.interpretation.traitDescriptions.${traitKey}.high`);
    } else if (percentile <= 40) {
      return t(`results.interpretation.traitDescriptions.${traitKey}.low`);
    } else {
      return t(`results.interpretation.traitDescriptions.${traitKey}.moderate`);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2">{t('results.interpretation.title')}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
          {t('results.interpretation.subtitle')}
        </p>
      </div>

      {/* Big Five Overview */}
      <div className="bg-card rounded-lg border p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('results.interpretation.aboutModel.title')}</h3>
        <p className="text-muted-foreground mb-3 md:mb-4 text-sm md:text-base">
          {t('results.interpretation.aboutModel.description')}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">
          {t('results.interpretation.aboutModel.note')}
        </p>
      </div>

      {/* Individual Trait Interpretations */}
      <div className="space-y-4 md:space-y-6">
        {Object.entries(scores).map(([traitKey, score]) => {
          const color = traitColors[traitKey as keyof BigFiveScores];
          const isNeuroticismTrait = traitKey === 'neuroticism';
          const displayScore = showTScores ? score : score;
          const percentile = Math.round((showTScores ? score : score) * 100);

          return (
            <div key={traitKey} className="bg-card rounded-lg border p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex-1">
                  <h3 className={`text-lg md:text-xl font-semibold text-${color}-600 mb-2`}>
                    {t(`results.interpretation.traitDescriptions.${traitKey}.name`)}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <div className="text-xl md:text-2xl font-bold">
                      {showTScores ? Math.round(displayScore) : displayScore.toFixed(2)}
                      {showTScores ? '' : '/1.00'}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {getPercentileInterpretation(showTScores ? displayScore / 100 : displayScore, isNeuroticismTrait)}
                    </div>
                  </div>
                </div>

                {/* Visual Score Bar */}
                <div className="w-full sm:w-24 sm:ml-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${color}-500 transition-all duration-300`}
                      style={{ width: `${Math.min(percentile, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-center sm:text-center mt-1 text-muted-foreground">
                    {percentile}%
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm md:text-base">{t('results.interpretation.whatThisMeans')}</h4>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                    {t(`results.interpretation.traitDescriptions.${traitKey}.description`)}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm md:text-base">{t('results.interpretation.yourTendency')}</h4>
                  <p className="text-xs md:text-sm leading-relaxed">
                    {getScoreInterpretation(showTScores ? displayScore / 100 : displayScore, traitKey)}
                  </p>
                </div>

                {/* Behavioral Examples */}
                <div className="grid grid-cols-1 gap-3 mt-3 md:mt-4">
                  <div className="p-3 bg-muted/50 rounded">
                    <h5 className="font-medium text-xs md:text-sm mb-1">{t('results.interpretation.higher')} {t(`results.interpretation.traitDescriptions.${traitKey}.name`)}:</h5>
                    <p className="text-xs text-muted-foreground">
                      {t(`results.interpretation.traitDescriptions.${traitKey}.high`)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <h5 className="font-medium text-xs md:text-sm mb-1">{t('results.interpretation.lower')} {t(`results.interpretation.traitDescriptions.${traitKey}.name`)}:</h5>
                    <p className="text-xs text-muted-foreground">
                      {t(`results.interpretation.traitDescriptions.${traitKey}.low`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary and Next Steps */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('results.interpretation.summary.title')}</h3>
        <div className="space-y-3 text-xs md:text-sm text-muted-foreground">
          <p>
            {t('results.interpretation.summary.description')}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
            <li>{t('results.interpretation.summary.points.0')}</li>
            <li>{t('results.interpretation.summary.points.1')}</li>
            <li>{t('results.interpretation.summary.points.2')}</li>
            <li>{t('results.interpretation.summary.points.3')}</li>
          </ul>
          <p className="mt-3 md:mt-4 font-medium text-xs md:text-sm">
            {t('results.interpretation.summary.conclusion')}
          </p>
        </div>
      </div>
    </div>
  );
}