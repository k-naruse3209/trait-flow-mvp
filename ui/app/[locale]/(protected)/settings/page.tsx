import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/translations";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const supabase = await createClient();
  const { locale } = await params;

  // Validate user authentication
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Validate locale
  const supportedLocales = ['en', 'vi', 'ja'];
  if (!supportedLocales.includes(locale)) {
    redirect("/en/settings");
  }

  const messages = getMessages(locale as 'en' | 'vi' | 'ja');
  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || defaultValue || key;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title', 'Settings')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle', 'Manage your account settings and preferences')}</p>
      </div>

      <SettingsClient />
    </div>
  );
}