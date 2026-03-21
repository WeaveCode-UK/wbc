import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import '../styles/globals.css';
import '../styles/themes.css';
import { ThemeProvider } from '../providers/theme-provider';

const sora = Sora({ subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'WBC — Wave Beauty Consultant',
  description: 'CRM para consultoras de beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="default" data-mode="light">
      <body className={`${sora.className} bg-bg-tertiary text-text-primary`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
