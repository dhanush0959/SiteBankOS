'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { unwrap } from '@/lib/api';

export interface SmartLink {
  id: string;
  propertyId: string;
  slug: string;
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
  expiryAt?: string | null;
  passwordHash?: string | null;
  shareCount: number;
  createdAt: string;
  property?: { id: string; title: string };
}

export interface SmartLinkFilters {
  propertyId?: string;
  status?: SmartLink['status'];
  page?: number;
  pageSize?: number;
}

export interface SmartLinkPage {
  items: SmartLink[];
  total: number;
  page: number;
  pageSize: number;
}

export function useSmartLinks(filters: SmartLinkFilters = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ['smart-links', filters],
    queryFn: async () =>
      unwrap<SmartLinkPage>(await api.get('/smart-links', { params: filters })),
  });
}

export function useSmartLink(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['smart-links', id],
    queryFn: async () => unwrap<SmartLink>(await api.get(`/smart-links/${id}`)),
    enabled: !!id,
  });
}

export function useCreateSmartLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { propertyId: string; expiresInDays?: number; password?: string }) =>
      unwrap<SmartLink>(await api.post('/smart-links', vars)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-links'] }),
  });
}

export function useUpdateSmartLink(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { status?: string; expiresInDays?: number; password?: string | null }) =>
      unwrap<SmartLink>(await api.patch(`/smart-links/${id}`, vars)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smart-links'] });
      qc.invalidateQueries({ queryKey: ['smart-links', id] });
    },
  });
}

export function useDeleteSmartLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/smart-links/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-links'] }),
  });
}

export function useRegenerateSmartLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap<SmartLink>(await api.post(`/smart-links/${id}/regenerate`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-links'] }),
  });
}
