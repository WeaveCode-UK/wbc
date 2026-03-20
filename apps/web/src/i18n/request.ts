import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from '@wbc/i18n';

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`@wbc/i18n/src/locales/${locale}/common.json`)).default,
  };
});
