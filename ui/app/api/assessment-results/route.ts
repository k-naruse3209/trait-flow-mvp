import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { BigFiveScores } from "@/lib/tipi";

interface AssessmentResultData {
  id: string;
  traits_p01: BigFiveScores;
  traits_t: BigFiveScores;
  administered_at: string;
  instrument: string;
}

interface AssessmentResultsResponse {
  success: boolean;
  data?: AssessmentResultData | null;
  error?: string;
}

export async function GET(): Promise<NextResponse<AssessmentResultsResponse>> {
  try {
    const supabase = await createClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query baseline_traits table for most recent assessment
    const { data: assessment, error: queryError } = await supabase
      .from('baseline_traits')
      .select('id, traits_p01, traits_t, administered_at, instrument')
      .eq('user_id', user.id)
      .order('administered_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError) {
      // Handle case where no assessment exists
      if (queryError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null
        });
      }
      
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve assessment results' },
        { status: 500 }
      );
    }

    // Format and return assessment data
    const formattedData: AssessmentResultData = {
      id: assessment.id,
      traits_p01: assessment.traits_p01 as BigFiveScores,
      traits_t: assessment.traits_t as BigFiveScores,
      administered_at: assessment.administered_at,
      instrument: assessment.instrument
    };

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}