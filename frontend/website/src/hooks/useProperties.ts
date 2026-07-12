'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { getAccessToken } from '@/lib/auth';
import { unwrap } from '@/lib/api';

export interface PropertyMedia {
  id: string;
  fileUrl: string;
  cdnUrl?: string | null;
  fileType: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'THUMBNAIL' | 'AUDIO';
  orderIndex: number;
  isCover: boolean;
  width?: number | null;
  height?: number | null;
}

export interface Property {
  id: string;
  title: string;
  aiGeneratedTitle?: string | null;
  aiGeneratedDescription?: string | null;
  propertyType: string;
  transactionType: string;
  price?: string | null;
  priceNegotiable: boolean;
  priceOnRequest: boolean;
  ownershipType?: string | null;
  location: { address: string; city: string; state?: string; pincode?: string; lat?: number; lng?: number };
  specs: Record<string, unknown>;
  approvals?: Record<string, unknown> | null;
  amenities?: string[] | null;
  internalNotes?: string | null;
  status: 'ACTIVE' | 'UNDER_NEGOTIATION' | 'SOLD' | 'RENTED' | 'ARCHIVED';
  verificationStatus: 'UNVERIFIED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  media?: PropertyMedia[];
  _count?: { smartLinks: number; leads: number };
}

export interface PropertyListPage {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PropertyFilters {
  status?: string;
  propertyType?: string;
  transactionType?: string;
  city?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'price' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}

export function useProperties(filters: PropertyFilters = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () =>
      unwrap<PropertyListPage>(await api.get('/properties', { params: filters })),
  });
}

export function useProperty(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['properties', id],
    queryFn: async () => unwrap<Property>(await api.get(`/properties/${id}`)),
    enabled: !!id,
  });
}

export function useCities() {
  const api = useApi();
  return useQuery({
    queryKey: ['properties', 'cities'],
    queryFn: async () => unwrap<string[]>(await api.get('/properties/cities')),
  });
}

export function useCreateProperty() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown> | FormData) => {
      if (data instanceof FormData) {
        const token = getAccessToken();
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
        const res = await fetch(`${API}/properties`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = Array.isArray(errData.message) 
            ? errData.message.join(', ') 
            : errData.message;
          throw new Error(msg || 'Failed to create property');
        }
        return (await res.json()).data as Property;
      }
      return unwrap<Property>(await api.post('/properties', data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties', 'cities'] });
    },
  });
}

export function useUpdateProperty(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      unwrap<Property>(await api.patch(`/properties/${id}`, data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties', id] });
      qc.invalidateQueries({ queryKey: ['properties', 'cities'] });
    },
  });
}

export function useArchiveProperty() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
}

export function useUploadMedia(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const token = getAccessToken();
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const res = await fetch(`${API}/properties/${id}/media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) 
          ? errData.message.join(', ') 
          : errData.message;
        throw new Error(msg || 'Failed to upload media');
      }
      return (await res.json()).data as Property;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties', id] }),
  });
}

export function useDeleteMedia(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => api.delete(`/properties/${id}/media/${mediaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties', id] }),
  });
}

export function useSetCover(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) =>
      api.patch(`/properties/${id}/media/${mediaId}/cover`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties', id] }),
  });
}

export function useSubmitForVerification(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post(`/properties/${id}/submit-for-verification`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties', id] }),
  });
}

export function useChangePropertyStatus(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) =>
      unwrap<Property>(await api.post(`/properties/${id}/status`, { status })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties', id] });
    },
  });
}

export interface BulkUploadResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
}

export function useBulkUploadProperty() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAccessToken();
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const res = await fetch(`${API}/properties/bulk-upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to bulk upload properties');
      }
      return (await res.json()).data as BulkUploadResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties', 'cities'] });
    },
  });
}
