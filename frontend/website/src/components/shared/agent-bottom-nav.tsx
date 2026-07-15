'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const leftItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
];

const rightItems = [
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AgentBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-2 w-[98%] max-w-2xl pointer-events-none">
      <nav className="pointer-events-auto mx-auto w-full rounded-[2rem] bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border py-2 px-2 flex items-center justify-between gap-1 transition-all duration-300 relative">
        {/* Left items */}
        <div className="flex flex-1 justify-around items-center h-14 relative z-10">
          {leftItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative transition-colors duration-300 z-10 rounded-2xl',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 180, damping: 25 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-[20px] w-[20px] mb-1 transition-transform duration-300',
                    isActive ? 'scale-110' : 'hover:scale-110'
                  )}
                />
                <span className={cn('text-[10px] font-bold tracking-tight', isActive ? 'opacity-100' : 'opacity-70')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Center FAB – Add Property */}
        <div className="flex items-center justify-center relative z-20 px-2 mx-1 -mt-10">
          <div className="bg-background rounded-full p-2 shadow-sm">
            <Link
              href="/properties/new"
              className="group relative flex flex-col items-center justify-center w-16 h-16 rounded-full bg-primary shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label="Add Property"
            >
              <Plus className="h-8 w-8 text-white transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Right items */}
        <div className="flex flex-1 justify-around items-center h-14 relative z-10">
          {rightItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative transition-colors duration-300 z-10 rounded-2xl',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 180, damping: 25 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-[20px] w-[20px] mb-1 transition-transform duration-300',
                    isActive ? 'scale-110' : 'hover:scale-110'
                  )}
                />
                <span className={cn('text-[10px] font-bold tracking-tight', isActive ? 'opacity-100' : 'opacity-70')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
