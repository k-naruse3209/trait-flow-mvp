import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TipiAssessment } from "@/components/tipi-assessment";

export default async function AssessmentPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <TipiAssessment />
    </div>
  );
}