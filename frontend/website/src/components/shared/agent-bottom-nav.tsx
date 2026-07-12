'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const leftItems = [
  { href: '/properties', label: 'Properties', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
];

const rightItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AgentBottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Mobile View: Floating Dock (Hidden on desktop) ─── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-2 w-[98%] max-w-sm md:hidden pointer-events-none">
        <nav className="pointer-events-auto mx-auto w-full rounded-3xl bg-white dark:bg-card shadow-xl border border-border/60 py-2 px-2 flex items-center justify-between gap-1 transition-all duration-300">
          {/* Left items */}
          {leftItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-12 relative transition-all duration-300 group rounded-2xl',
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300',
                    isActive ? 'bg-accent/10' : 'group-hover:bg-slate-50 dark:group-hover:bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-all duration-300',
                      isActive ? 'scale-110 text-accent' : 'group-hover:scale-110'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[9px] font-bold tracking-tight transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-70'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center FAB – Add Property */}
          <div className="flex items-center justify-center -mt-8 mx-1 relative z-10 px-2">
            <Link
              href="/properties/new"
              className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-full bg-accent shadow-lg border-[4px] border-background hover:scale-110 active:scale-95 transition-all duration-300"
              aria-label="Add Property"
            >
              <Plus className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right items */}
          {rightItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-12 relative transition-all duration-300 group rounded-2xl',
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300',
                    isActive ? 'bg-accent/10' : 'group-hover:bg-slate-50 dark:group-hover:bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-all duration-300',
                      isActive ? 'scale-110 text-accent' : 'group-hover:scale-110'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[9px] font-bold tracking-tight transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-70'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
