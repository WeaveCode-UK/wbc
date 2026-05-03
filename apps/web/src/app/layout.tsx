import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "../weavecode/colors_and_type.css";
import "../styles/globals.css";
import "../styles/themes.css";
import { ThemeProvider } from "../providers/theme-provider";
import { SessionProvider } from "../providers/session-provider";
import { TrpcProvider } from "../providers/trpc-provider";
import { ToastProvider } from "../providers/toast-provider";
import { WebVitalsClient } from "../components/web-vitals-client";

export const metadata: Metadata = {
  title: "WBC — Wave Beauty Consultant",
  description: "CRM para consultoras de beleza",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="default" data-mode="light">
      <body className="font-sans bg-bg-tertiary text-text-primary antialiased">
        <SessionProvider>
          <TrpcProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ThemeProvider>
                <ToastProvider>
                  <WebVitalsClient />
                  {children}
                </ToastProvider>
              </ThemeProvider>
            </NextIntlClientProvider>
          </TrpcProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
