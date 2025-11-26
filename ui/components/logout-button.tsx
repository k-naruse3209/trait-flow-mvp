"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "./translation-provider";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    // router.push("/auth/login");
  };

  return <Button onClick={logout}>{t('navigation.signOut')}</Button>;
}
