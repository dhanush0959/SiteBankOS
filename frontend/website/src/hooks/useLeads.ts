'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { unwrap } from '@/lib/api';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_VISIT_SCHEDULED'
  | 'NEGOTIATING'
  | 'CLOSED'
  | 'DEAD';

export interface Lead {
  id: string;
  propertyId: string;
  agentId: string;
  name?: string | null;
  phone?: string | null;
  source?: string | null;
  hotScore: number;
  status: LeadStatus;
  lastActivityAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: { id: string; title: string; location: { city: string; address: string } };
}

export interface LeadFilters {
  status?: LeadStatus;
  propertyId?: string;
  q?: string;
  source?: string;
  hotScoreMin?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'lastActivityAt' | 'hotScore';
  sortDir?: 'asc' | 'desc';
}

export interface LeadListPage {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeadStats {
  NEW: number;
  CONTACTED: number;
  SITE_VISIT_SCHEDULED: number;
  NEGOTIATING: number;
  CLOSED: number;
  DEAD: number;
  total: number;
}

export interface Reminder {
  id: string;
  agentId: string;
  leadId?: string | null;
  propertyId?: string | null;
  remindAt: string;
  note?: string | null;
  status: 'PENDING' | 'DONE' | 'SNOOZED';
  createdAt: string;
}

export function useLeads(filters: LeadFilters = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => unwrap<LeadListPage>(await api.get('/leads', { params: filters })),
  });
}

export function useLead(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => unwrap<Lead>(await api.get(`/leads/${id}`)),
    enabled: !!id,
  });
}

export function useLeadStats() {
  const api = useApi();
  return useQuery({
    queryKey: ['leads', 'stats'],
    queryFn: async () => unwrap<LeadStats>(await api.get('/leads/stats')),
    staleTime: 30 * 1000,
  });
}

export function useCreateLead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead> & { propertyId: string }) =>
      unwrap<Lead>(await api.post('/leads', data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>) =>
      unwrap<Lead>(await api.patch(`/leads/${id}`, data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', id] });
    },
  });
}

export function useDeleteLead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useReminders(leadId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['leads', leadId, 'reminders'],
    queryFn: async () => unwrap<Reminder[]>(await api.get(`/leads/${leadId}/reminders`)),
    enabled: !!leadId,
  });
}

export function useCreateReminder(leadId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { remindAt: string; note?: string }) =>
      unwrap<Reminder>(await api.post(`/leads/${leadId}/reminders`, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads', leadId, 'reminders'] }),
  });
}

export function useUpdateReminder() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; status?: string; remindAt?: string }) => {
      const { id, ...rest } = vars;
      return unwrap<Reminder>(await api.patch(`/leads/reminders/${id}`, rest));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
