'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@wbc/ui';

const navItems = [
  { href: '/', key: 'nav_my_day', icon: '🏠' },
  { href: '/clients', key: 'nav_clients', icon: '👥' },
  { href: '/sales', key: 'nav_sales', icon: '💰' },
  { href: '/schedule', key: 'nav_schedule', icon: '📅' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('common');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] md:hidden" aria-label="Main navigation">
      <div className="flex items-center justify-around">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center py-2 px-3',
              pathname === item.href ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]',
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{t(item.key)}</span>
          </Link>
        ))}
        <div className="relative -mt-6">
          <button aria-label={t('create')} className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xl shadow-lg hover:bg-[var(--color-primary-hover)] transition-colors">
            +
          </button>
        </div>
        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center py-2 px-3',
              pathname === item.href ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]',
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{t(item.key)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
