'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { unwrap } from '@/lib/api';

export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface Agency {
  id: string;
  name: string;
  logoUrl: string | null;
  ownerUserId: string;
  address: string | null;
  customDomain: string | null;
  brandingSettings: any;
  members: AgencyMember[];
}

export function useMyAgency() {
  const api = useApi();
  return useQuery({
    queryKey: ['agency', 'me'],
    queryFn: async () => unwrap<Agency>(await api.get('/agencies/me')),
    retry: false,
  });
}

export function useUpdateAgency() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: Partial<Agency> }) =>
      api.patch(`/agencies/${vars.id}`, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency', 'me'] }),
  });
}

export function useInviteMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agencyId: string; email: string; role: string }) =>
      api.post(`/agencies/${vars.agencyId}/members/invite`, { email: vars.email, role: vars.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency', 'me'] }),
  });
}

export function useRemoveMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agencyId: string; userId: string }) =>
      api.delete(`/agencies/${vars.agencyId}/members/${vars.userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency', 'me'] }),
  });
}

export function useUploadAgencyLogo() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', vars.file);
      return api.post(`/agencies/${vars.agencyId}/logo`, formData);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency', 'me'] }),
  });
}
