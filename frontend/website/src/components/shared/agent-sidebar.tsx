'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Link as LinkIcon,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/smart-links', label: 'Smart Links', icon: LinkIcon },
];

export function AgentSidebar() {
  const pathname = usePathname();
  const { data } = useMe();
  
  const initial = data?.name
    ? data.name.charAt(0).toUpperCase()
    : data?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 bg-sidebar-bg text-sidebar-fg h-full transition-all duration-300 border-r border-sidebar-bg/10 z-20">
      {/* Brand */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center shadow-lg shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white leading-tight">
              SiteBank
            </span>
            <span className="text-[10px] font-bold tracking-widest text-sidebar-fg/50 uppercase">
              Property OS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                active
                  ? 'bg-sidebar-accent/10 text-white'
                  : 'text-sidebar-fg/70 hover:bg-white/5 hover:text-white'
              )}
            >
              {active && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sidebar-accent shadow-[0_0_8px_var(--sidebar-accent)]" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200',
                  active ? 'text-sidebar-accent' : 'group-hover:scale-110 group-hover:text-sidebar-fg'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {data?.name || data?.email?.split('@')[0] || 'Agent'}
            </p>
            <p className="text-xs text-sidebar-fg/60 truncate uppercase tracking-wider font-semibold">
              {data?.role?.replace(/_/g, ' ') || 'Agent'}
            </p>
          </div>
        </div>
        
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-fg/70 hover:bg-white/5 hover:text-white transition-all duration-200"
        >
          <Settings className="h-5 w-5 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
