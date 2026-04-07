import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, namespaces } from '@wbc/i18n';

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  const messages: Record<string, Record<string, string>> = {};
  for (const ns of namespaces) {
    const mod = await import(`@wbc/i18n/src/locales/${locale}/${ns}.json`);
    messages[ns] = mod.default;
  }
  return { locale, messages };
});
