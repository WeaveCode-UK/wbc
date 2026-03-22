'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@wbc/ui';

const navItems = [
  { href: '/', label: 'Meu Dia', icon: '🏠' },
  { href: '/clients', label: 'Clientes', icon: '👥' },
  { href: '/sales', label: 'Vendas', icon: '💰' },
  { href: '/schedule', label: 'Agenda', icon: '📅' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] md:hidden">
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
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        ))}
        <div className="relative -mt-6">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xl shadow-lg hover:bg-[var(--color-primary-hover)] transition-colors">
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
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
