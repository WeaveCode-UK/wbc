import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "../styles/globals.css";
import "../styles/themes.css";
import { ThemeProvider } from "../providers/theme-provider";
import { SessionProvider } from "../providers/session-provider";
import { TrpcProvider } from "../providers/trpc-provider";
import { ToastProvider } from "../providers/toast-provider";
import { WebVitalsClient } from "../components/web-vitals-client";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500"] });

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
      <body className={`${sora.className} bg-bg-tertiary text-text-primary`}>
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
