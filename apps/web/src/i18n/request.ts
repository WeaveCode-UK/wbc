import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, namespaces, type Locale } from "@wbc/i18n";

function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}

export default getRequestConfig(async () => {
  // ACH-021: respect the NEXT_LOCALE cookie set by the language picker in
  // /settings/theme. Without this read the picker reloaded the page but
  // every request still resolved to defaultLocale → switching to "English"
  // had no visible effect anywhere in the UI.
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const messages: Record<string, Record<string, string>> = {};
  for (const ns of namespaces) {
    const mod = await import(`@wbc/i18n/src/locales/${locale}/${ns}.json`);
    messages[ns] = mod.default;
  }
  return { locale, messages };
});
