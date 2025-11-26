'use client';

import { useEffect } from 'react';

interface LocaleHtmlWrapperProps {
  locale: string;
  children: React.ReactNode;
}

export function LocaleHtmlWrapper({ locale, children }: LocaleHtmlWrapperProps) {
  useEffect(() => {
    // Set lang attribute on document element
    document.documentElement.lang = locale;
    
    // Cleanup function to reset lang attribute
    return () => {
      document.documentElement.lang = 'en'; // Default fallback
    };
  }, [locale]);

  return <>{children}</>;
}