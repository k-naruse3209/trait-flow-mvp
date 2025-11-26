import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  console.log('i18n request config - locale:', locale);
  
  // Validate and normalize locale
  let validLocale: string = locale || 'vi';
  if (validLocale !== 'en' && validLocale !== 'vi') {
    console.log('i18n request config - invalid locale, using fallback vi');
    validLocale = 'vi'; // fallback to default
  }

  try {
    console.log('i18n request config - loading messages for:', validLocale);
    const messages = (await import(`../messages/${validLocale}.json`)).default;
    console.log('i18n request config - messages loaded for:', validLocale);
    return {
      locale: validLocale,
      messages
    };
  } catch (error) {
    console.error('i18n request config - error loading messages:', error);
    // Return fallback with vi locale
    return {
      locale: 'vi',
      messages: {}
    };
  }
});