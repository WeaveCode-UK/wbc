'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@wbc/ui';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'H' },
  { href: '/clients', label: 'Clientes', icon: 'C' },
  { href: '/sales', label: 'Vendas', icon: 'V' },
  { href: '/campaigns', label: 'Campanhas', icon: 'K' },
  { href: '/schedule', label: 'Agenda', icon: 'A' },
  { href: '/finance', label: 'Financeiro', icon: 'F' },
  { href: '/inventory', label: 'Estoque', icon: 'E' },
  { href: '/team', label: 'Equipe', icon: 'T' },
  { href: '/settings', label: 'Config', icon: 'S' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold text-blue-600">WBC</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-bold">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
