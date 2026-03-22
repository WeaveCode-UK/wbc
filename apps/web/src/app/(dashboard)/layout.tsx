'use client';

import { Sidebar } from '../../components/sidebar';
import { BottomNav } from '../../components/bottom-nav';
import { ErrorBoundary } from '../../components/error-boundary';
import { useTheme } from '../../providers/theme-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, mode, toggleMode, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-tertiary)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] px-6">
          <div />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'default' ? 'rose' : 'default')}
              className="text-caption text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-bg-secondary)]"
            >
              {theme === 'default' ? '💜 Padrão' : '🌹 Rose'}
            </button>
            <button
              onClick={toggleMode}
              className="text-caption text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-bg-secondary)]"
            >
              {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-caption font-medium">
              MC
            </div>
          </div>
        </header>
        <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
