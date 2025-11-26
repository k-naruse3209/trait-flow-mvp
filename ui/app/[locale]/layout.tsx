import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { getMessages } from '@/lib/translations';
import { TranslationProvider } from '@/components/translation-provider';
import { LocaleHtmlWrapper } from '@/components/locale-html-wrapper';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  console.log('LocaleLayout - locale received:', locale);
  
  // Simple validation
  if (locale !== 'en' && locale !== 'vi' && locale !== 'ja') {
    console.log('LocaleLayout - invalid locale, calling notFound()');
    notFound();
  }

  // Load messages using our custom system
  const messages = getMessages(locale as 'en' | 'vi' | 'ja');
  console.log('LocaleLayout - messages loaded for:', locale);
  
  return (
    <LocaleHtmlWrapper locale={locale}>
      <TranslationProvider locale={locale as 'en' | 'vi'} messages={messages}>
        {children}
      </TranslationProvider>
    </LocaleHtmlWrapper>
  );
}