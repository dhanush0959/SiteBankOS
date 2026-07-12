'use client';

import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreloaderProps {
  message?: string;
  isVisible: boolean;
  fullScreen?: boolean;
}

export function Preloader({ message = 'Loading...', isVisible, fullScreen = true }: PreloaderProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300',
        fullScreen ? 'fixed inset-0' : 'absolute inset-0 rounded-inherit'
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Pulsing ring background */}
        <div className="absolute inset-0 -m-8 rounded-full bg-accent/20 animate-glow-pulse" />
        
        {/* Logo container */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/30 animate-float">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        
        {/* Loading text */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm font-semibold text-muted-foreground animate-pulse mt-2">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
