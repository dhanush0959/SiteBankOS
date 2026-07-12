'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/auth';
import { Preloader } from '@/components/shared/preloader';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError } = useMe();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getAccessToken();
    if (!token && !isLoading) {
      router.replace('/login');
    }
    if (isError && !isLoading) {
      router.replace('/login');
    }
  }, [isError, isLoading, router]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background relative">
        <Preloader isVisible={true} message="Setting up your workspace..." />
      </div>
    );
  }

  return <>{children}</>;
}
