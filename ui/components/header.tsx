"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { HeaderNav } from "./header-nav";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale, useTranslations } from "./translation-provider";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const locale = useLocale();
  const t = useTranslations();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      setUser(data?.claims || null);
      setLoading(false);
    };
    
    getUser();
  }, []);

  if (loading) {
    return (
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 relative">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-4 md:gap-8 items-center font-semibold">
            <Link href={`/${locale}`} className="text-sm md:text-base">
              Trait Flow
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 relative">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-4 md:gap-8 items-center font-semibold">
          <Link href={`/${locale}`} className="text-sm md:text-base">
            Trait Flow
          </Link>

          <HeaderNav isAuthenticated={!!user} locale={locale} />
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {(user?.email as string)?.charAt(0).toUpperCase() || 'U'}
              </div>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild size="sm" variant={"outline"}>
                <Link href={`/${locale}/auth/login`}>{t('navigation.signIn')}</Link>
              </Button>
              <Button asChild size="sm" variant={"default"}>
                <Link href={`/${locale}/auth/sign-up`}>{t('navigation.signUp')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}