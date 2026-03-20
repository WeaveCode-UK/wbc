import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WBC — Consultora de Beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
