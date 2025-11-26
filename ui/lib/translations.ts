import enMessages from '../messages/en.json';
import viMessages from '../messages/vi.json';
import jaMessages from '../messages/ja.json';

const messages = {
  en: enMessages,
  vi: viMessages,
  ja: jaMessages
} as const;

export type Locale = keyof typeof messages;

export function getMessages(locale: Locale) {
  return messages[locale] || messages.en;
}

export function t(locale: Locale, key: string, defaultValue?: string): string {
  const msgs = getMessages(locale);
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = msgs;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || defaultValue || key;
}