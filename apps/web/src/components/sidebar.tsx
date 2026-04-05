'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@wbc/ui';

const navItems = [
  { href: '/', key: 'nav_my_day', icon: '🏠', dot: 'var(--color-primary)' },
  { href: '/clients', key: 'nav_clients', icon: '👥', dot: 'var(--color-info)' },
  { href: '/sales', key: 'nav_sales', icon: '💰', dot: 'var(--color-success)' },
  { href: '/campaigns', key: 'nav_campaigns', icon: '📢', dot: 'var(--color-warning)' },
  { href: '/schedule', key: 'nav_schedule', icon: '📅', dot: 'var(--color-info)' },
  { href: '/finance', key: 'nav_finance', icon: '📊', dot: 'var(--color-success)' },
  { href: '/inventory', key: 'nav_inventory', icon: '📦', dot: 'var(--color-warning)' },
  { href: '/team', key: 'nav_team', icon: '👩‍👩‍👧', dot: 'var(--color-primary)' },
  { href: '/settings', key: 'nav_settings', icon: '⚙️', dot: 'var(--color-text-tertiary)' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('common');

  return (
    <aside className="hidden md:flex md:w-[220px] md:flex-col border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]">
      <div className="flex h-14 items-center px-6 border-b border-[var(--color-border-tertiary)]">
        <span className="text-heading-2 text-[var(--color-primary)]" style={{ fontFamily: 'Azonix, Sora, sans-serif' }}>WBC</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-body-small font-medium transition-colors duration-200',
              pathname === item.href
                ? 'bg-[var(--color-primary-surface)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-bg-secondary)] text-base">
              {item.icon}
            </span>
            {t(item.key)}
            {pathname === item.href && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
