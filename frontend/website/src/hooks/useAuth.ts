'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApi } from './useApi';
import { unwrap } from '@/lib/api';
import { clearAccessToken, setAccessToken } from '@/lib/auth';

export interface MeResponse {
  sub: string;
  email: string;
  role: string;
  name?: string;
  agencyId?: string | null;
  isVerified?: boolean;
}

export function useMe() {
  const api = useApi();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => unwrap<MeResponse>(await api.get('/auth/me')),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const api = useApi();
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearAccessToken();
      qc.clear(); // Wipe all data from memory
      router.push('/login');
    },
  });
}

export function useRequestPasswordReset() {
  const api = useApi();
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/password-reset/request', { email }),
  });
}

export function useConfirmPasswordReset() {
  const api = useApi();
  return useMutation({
    mutationFn: (vars: { token: string; newPassword: string }) =>
      api.post('/auth/password-reset/confirm', vars),
  });
}

export function useConfirmEmailVerification() {
  const api = useApi();
  return useMutation({
    mutationFn: (token: string) => api.post('/auth/verify-email/confirm', { token }),
  });
}

export function useChangePassword() {
  const api = useApi();
  return useMutation({
    mutationFn: (vars: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/password/change', vars),
  });
}

export { setAccessToken };
