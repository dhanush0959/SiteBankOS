'use client';
import Link from 'next/link';
import { Bell, Search, Plus, ChevronDown, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMe, useLogout } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AgentHeader() {
  const { data } = useMe();
  const logout = useLogout();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    if (profileDropdownOpen || notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen, notifDropdownOpen]);

  const initial = data?.name
    ? data.name.charAt(0).toUpperCase()
    : data?.email?.charAt(0).toUpperCase() ?? '?';

  // Dynamic Page Title
  let pageTitle = 'Dashboard';
  if (pathname.includes('/properties')) pageTitle = 'Properties';
  if (pathname.includes('/leads')) pageTitle = 'Leads';
  if (pathname.includes('/analytics')) pageTitle = 'Analytics';
  if (pathname.includes('/smart-links')) pageTitle = 'Smart Links';
  if (pathname.includes('/settings')) pageTitle = 'Settings';
  if (pathname.includes('/profile')) pageTitle = 'Profile';

  return (
    <header className="h-[72px] bg-white border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-40 transition-all duration-300 shadow-sm">
      
      {/* Left: Dynamic Title */}
      <div className="flex items-center gap-3 shrink-0">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl hidden md:block">
          {pageTitle}
        </h1>
        {/* Mobile Title / Logo area */}
        <h1 className="text-xl font-extrabold tracking-tight md:hidden">
          Site<span className="text-accent">Bank</span>
        </h1>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-xl mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search properties, leads..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Right side actions */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full w-10 h-10 hover:bg-accent/10 hover:text-accent transition-colors"
            aria-label="Notifications"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-destructive animate-pulse border border-white" />
          </Button>

          {notifDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 premium-glass-card rounded-2xl p-4 animate-slide-in-down z-50 shadow-xl border border-border">
              <h3 className="font-bold text-sm mb-3">Notifications</h3>
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
                <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border bg-white hover:bg-slate-50:bg-white/5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initial}
            </div>
            <span className="text-sm font-semibold hidden lg:block mr-1">
              {initial}{data?.name ? data.name.substring(1).split(' ')[0] : ''}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 premium-glass-card rounded-2xl p-2 animate-slide-in-down z-50 shadow-xl border border-border">
              <div className="px-3 py-3 mb-2 bg-slate-50 rounded-xl border border-border/50">
                <p className="text-sm font-bold leading-tight truncate">
                  {data?.name || data?.email?.split('@')[0] || 'Agent'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
                  {data?.email}
                </p>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex w-full items-center px-3 py-2.5 text-sm rounded-xl hover:bg-accent/10 hover:text-accent transition-colors font-medium"
              >
                <User className="h-4 w-4 mr-2.5 opacity-70" /> Profile
              </Link>
              
              <Link
                href="/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex w-full items-center px-3 py-2.5 text-sm rounded-xl hover:bg-accent/10 hover:text-accent transition-colors font-medium"
              >
                <SettingsIcon className="h-4 w-4 mr-2.5 opacity-70" /> Settings
              </Link>

              <div className="h-px bg-border my-1.5 mx-2" />
              
              <button
                onClick={() => { setProfileDropdownOpen(false); logout.mutate(); }}
                className="flex w-full items-center px-3 py-2.5 text-sm rounded-xl hover:bg-destructive/10 text-destructive transition-colors font-medium"
              >
                <LogOut className="h-4 w-4 mr-2.5 opacity-70" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
