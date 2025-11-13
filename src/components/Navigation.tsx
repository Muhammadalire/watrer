'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, TrendingUp, Gift } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Track',
      icon: Droplets
    },
    {
      href: '/progress',
      label: 'Progress',
      icon: TrendingUp
    },
    {
      href: '/rewards',
      label: 'Rewards',
      icon: Gift
    }
  ];

  return (
    <nav className="flex justify-center mb-8">
      <div className="bg-white/80 backdrop-blur-md rounded-full border-2 border-pink-200 p-2 flex gap-2 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-6 py-3 rounded-full transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                  : 'text-gray-600 hover:text-pink-400 hover:bg-pink-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}