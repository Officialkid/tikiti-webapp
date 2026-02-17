'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PlusCircleIcon,
  QrCodeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { href: '/organize', label: 'Dashboard', icon: HomeIcon },
  { href: '/organize/create', label: 'Create Event', icon: PlusCircleIcon },
  { href: '/organize/scanner', label: 'Scanner', icon: QrCodeIcon },
  { href: '/organize/analytics', label: 'Analytics', icon: ChartBarIcon },
];

export default function OrganizerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] py-6 px-3 flex-shrink-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">
        Organizer
      </p>

      <nav className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-primary-600' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
