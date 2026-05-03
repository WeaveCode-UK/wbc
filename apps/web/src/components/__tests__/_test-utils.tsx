import type { ReactElement, ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptCommon from "@wbc/i18n/src/locales/pt-BR/common.json";
import ptClients from "@wbc/i18n/src/locales/pt-BR/clients.json";
import ptCatalog from "@wbc/i18n/src/locales/pt-BR/catalog.json";
import ptFinance from "@wbc/i18n/src/locales/pt-BR/finance.json";
import ptInventory from "@wbc/i18n/src/locales/pt-BR/inventory.json";
import ptSchedule from "@wbc/i18n/src/locales/pt-BR/schedule.json";
import ptSales from "@wbc/i18n/src/locales/pt-BR/sales.json";

// T4 — UI test helpers. Wraps render() with the next-intl provider preloaded
// with pt-BR messages from `@wbc/i18n` so components that call
// `useTranslations()` resolve real strings without hitting `getRequestConfig`.

const messages: Record<string, Record<string, string>> = {
  common: ptCommon as Record<string, string>,
  clients: ptClients as Record<string, string>,
  catalog: ptCatalog as Record<string, string>,
  finance: ptFinance as Record<string, string>,
  inventory: ptInventory as Record<string, string>,
  schedule: ptSchedule as Record<string, string>,
  sales: ptSales as Record<string, string>,
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  return render(ui, { wrapper: Wrapper, ...options });
}

export { messages as testMessages };
