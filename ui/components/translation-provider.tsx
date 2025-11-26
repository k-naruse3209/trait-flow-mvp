"use client";

import { createContext, useContext, ReactNode } from 'react';
import { Locale } from '@/lib/translations';

interface TranslationContextType {
    locale: Locale;
    messages: Record<string, unknown>;
    t: (key: string, defaultValue?: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
    locale: Locale;
    messages: Record<string, unknown>;
    children: ReactNode;
}

export function TranslationProvider({ locale, messages, children }: TranslationProviderProps) {
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
        <TranslationContext.Provider value={{ locale, messages, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslations() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslations must be used within a TranslationProvider');
    }
    return context.t;
}

export function useLocale() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a TranslationProvider');
    }
    return context.locale;
}