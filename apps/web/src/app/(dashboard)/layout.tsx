import { Sidebar } from '../../components/sidebar';
import { BottomNav } from '../../components/bottom-nav';
import { ErrorBoundary } from '../../components/error-boundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
