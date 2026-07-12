'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { unwrap } from '@/lib/api';

export type Range = '7d' | '30d' | '90d';

export interface DashboardAnalytics {
  range: Range;
  totals: {
    properties: number;
    activeProperties: number;
    smartLinks: number;
    totalViews: number;
    uniqueVisitors: number;
    leads: number;
    hotLeads: number;
  };
  timeseries: { date: string; views: number; leads: number }[];
  funnel: { views: number; contactClicks: number; leadSubmissions: number; conversionPct: number };
  topProperties: { propertyId: string; title: string; views: number; leads: number }[];
}

export function useDashboardAnalytics(range: Range = '30d') {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'dashboard', range],
    queryFn: async () =>
      unwrap<DashboardAnalytics>(await api.get('/analytics/dashboard', { params: { range } })),
  });
}

export function useAgencyAnalytics(range: Range = '30d') {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'agency', range],
    queryFn: async () =>
      unwrap<DashboardAnalytics>(await api.get('/analytics/agency', { params: { range } })),
  });
}

export interface PropertyAnalytics {
  range: Range;
  summary: {
    views: number;
    uniqueVisitors: number;
    contactClicks: number;
    whatsappClicks: number;
    callClicks: number;
    leadSubmissions: number;
    avgTimeOnPageSec: number;
    avgScrollDepthPct: number;
  };
  timeseries: { date: string; views: number; leads: number }[];
  referrers: { referrer: string; count: number }[];
  devices: { deviceHash: string; count: number }[];
}

export function usePropertyAnalytics(propertyId: string | undefined, range: Range = '30d') {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'property', propertyId, range],
    queryFn: async () =>
      unwrap<PropertyAnalytics>(
        await api.get(`/analytics/properties/${propertyId}`, { params: { range } }),
      ),
    enabled: !!propertyId,
  });
}

export function useLiveCounter(propertyId?: string, minutes = 15) {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'live', propertyId, minutes],
    queryFn: async () =>
      unwrap<{ count: number }>(
        await api.get('/analytics/live', { params: { propertyId, minutes } }),
      ),
    refetchInterval: 30_000,
  });
}
