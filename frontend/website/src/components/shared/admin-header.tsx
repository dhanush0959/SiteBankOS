'use client';

import Link from 'next/link';
import { Building2, LogOut, ShieldCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMe, useLogout } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

export function AdminHeader() {
  const { data } = useMe();
  const logout = useLogout();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const initial = data?.name
    ? data.name.charAt(0).toUpperCase()
    : data?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="h-16 premium-glass border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-glow-accent hover-lift">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight hidden sm:block">
            SiteBank <span className="text-accent">Admin</span>
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-6 ml-10">
        <Link href="/admin" className="text-sm font-semibold hover:text-accent transition-colors">Stats</Link>
        <Link href="/admin/users" className="text-sm font-semibold hover:text-accent transition-colors">Users</Link>
        <Link href="/admin/agencies" className="text-sm font-semibold hover:text-accent transition-colors">Agencies</Link>
        <Link href="/admin/properties" className="text-sm font-semibold hover:text-accent transition-colors">Properties</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-muted/50 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shadow-premium ring-2 ring-background">
              {initial}
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 premium-glass-card rounded-3xl p-2 z-50 shadow-xl border border-white/10">
              <div className="px-3 py-3 mb-1 bg-muted/30 rounded-2xl">
                <p className="text-sm font-bold truncate">{data?.name || data?.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-accent font-bold mt-0.5">Super Admin</p>
              </div>
              <Link
                href="/dashboard"
                className="flex w-full items-center px-4 py-3 text-sm rounded-2xl hover:bg-primary/10 transition-colors font-semibold"
              >
                Agent Dashboard
              </Link>
              <div className="h-px bg-border/50 my-1 mx-3" />
              <button
                onClick={() => { setProfileDropdownOpen(false); logout.mutate(); }}
                className="flex w-full items-center px-4 py-3 text-sm rounded-2xl hover:bg-destructive/10 text-destructive transition-colors font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
