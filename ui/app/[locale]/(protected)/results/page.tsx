import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BigFiveScores } from "@/lib/tipi";
import { AssessmentResults } from "@/components/AssessmentResults";
import { NoAssessmentResults } from "@/components/NoAssessmentResults";
import { AssessmentResultsError } from "@/components/AssessmentResultsError";
import { getMessages } from "@/lib/translations";

interface AssessmentResultData {
  id: string;
  traits_p01: BigFiveScores;
  traits_t: BigFiveScores;
  administered_at: string;
  instrument: string;
}

async function getAssessmentResults(): Promise<{ 
  data: AssessmentResultData | null; 
  error: string | null 
}> {
  try {
    const supabase = await createClient();
    
    // Query baseline_traits table for most recent assessment
    const { data: assessment, error } = await supabase
      .from('baseline_traits')
      .select('id, traits_p01, traits_t, administered_at, instrument')
      .order('administered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching assessment results:', error);
      return { 
        data: null, 
        error: `Database error: ${error.message}` 
      };
    }

    if (!assessment) {
      return { data: null, error: null };
    }

    // Validate the assessment data structure
    if (!assessment.traits_p01 || !assessment.traits_t) {
      console.error('Invalid assessment data structure:', assessment);
      return { 
        data: null, 
        error: 'Assessment data is incomplete or corrupted' 
      };
    }

    return {
      data: {
        id: assessment.id,
        traits_p01: assessment.traits_p01 as BigFiveScores,
        traits_t: assessment.traits_t as BigFiveScores,
        administered_at: assessment.administered_at,
        instrument: assessment.instrument
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error fetching assessment results:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

export default async function ResultsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const supabase = await createClient();
  const { locale } = await params;

  // Check authentication
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const messages = getMessages(locale as 'en' | 'vi');
  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || defaultValue || key;
  };

  // Fetch assessment results server-side
  const { data: assessmentResults, error: fetchError } = await getAssessmentResults();

  // If there was an error fetching results, show error component
  if (fetchError) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{t('results.errorTitle')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('results.errorSubtitle')}
          </p>
        </div>

        <AssessmentResultsError error={fetchError} />
      </div>
    );
  }

  // If no assessment exists, show the no results component
  if (!assessmentResults) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{t('results.noResultsTitle')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('results.noResultsSubtitle')}
          </p>
        </div>

        <NoAssessmentResults />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">{t('results.yourResults')}</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t('results.subtitle')}
        </p>
      </div>

      <AssessmentResults assessmentData={assessmentResults} />
    </div>
  );
}