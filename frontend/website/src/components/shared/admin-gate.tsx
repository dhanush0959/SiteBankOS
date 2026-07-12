'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/auth';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError } = useMe();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getAccessToken();
    if (!token && !isLoading) {
      router.replace('/login');
      return;
    }
    if (isError && !isLoading) {
      router.replace('/login');
      return;
    }
    if (data && data.role !== 'SUPER_ADMIN' && !isLoading) {
      router.replace('/dashboard');
    }
  }, [data, isError, isLoading, router]);

  if (isLoading || !data || data.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
