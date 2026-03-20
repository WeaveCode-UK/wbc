'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@wbc/ui';

const navItems = [
  { href: '/', label: 'Home', icon: 'H' },
  { href: '/clients', label: 'Clientes', icon: 'C' },
  { href: '/sales', label: 'Vendas', icon: 'V' },
  { href: '/campaigns', label: 'Campanhas', icon: 'K' },
  { href: '/schedule', label: 'Agenda', icon: 'A' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center py-2 px-3 text-xs',
              pathname === item.href ? 'text-blue-600' : 'text-gray-500',
            )}
          >
            <span className="text-lg font-bold">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
