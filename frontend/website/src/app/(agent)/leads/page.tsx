'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Phone, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLeads, useLeadStats, type LeadStatus } from '@/hooks/useLeads';
import { LeadStatusPill, HotScoreChip } from '@/components/leads/lead-status-pill';
import { timeAgo } from '@/lib/property-helpers';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED'];

const STATUS_COLORS: Record<string, string> = {
  '': 'from-blue-500 to-blue-600',
  'NEW': 'from-sky-500 to-sky-600',
  'CONTACTED': 'from-indigo-500 to-indigo-600',
  'SITE_VISIT_SCHEDULED': 'from-violet-500 to-violet-600',
};

export default function LeadsPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const stats = useLeadStats();

  const filters = {
    q: debounced || undefined,
    status: status || undefined,
    page,
    pageSize: 25,
    sortBy: 'lastActivityAt' as const,
    sortDir: 'desc' as const,
  };
  
  const { data, isLoading, isError } = useLeads(filters);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 25));

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.data ? (
              <>
                <span className="font-semibold text-foreground">{stats.data.total}</span> total ·{' '}
                <span className="text-sky-600 font-medium">{stats.data.NEW} new</span> ·{' '}
                <span className="text-foreground font-medium">
                  {stats.data.SITE_VISIT_SCHEDULED} active
                </span>
              </>
            ) : (
              <span className="inline-block w-32 h-4 bg-muted rounded animate-pulse" />
            )}
          </p>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <StatusChip label="All" value={stats.data?.total ?? 0} active={status === ''} onClick={() => { setStatus(''); setPage(1); }} />
        {STATUSES.map((s) => (
          <StatusChip
            key={s}
            label={s.replace(/_/g, ' ')}
            value={stats.data?.[s] ?? 0}
            active={status === s}
            onClick={() => { setStatus(s); setPage(1); }}
          />
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-9 rounded-lg h-10"
          />
        </div>
      </div>

      {/* Leads listing */}
      {isError ? (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load leads.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="border-0 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="divide-y border-b border-slate-100">
              {/* Header Skeleton */}
              <div className="bg-slate-50 flex items-center px-4 py-3 gap-4">
                <div className="h-4 w-32 bg-slate-200/60 rounded animate-pulse" />
                <div className="h-4 w-40 bg-slate-200/60 rounded animate-pulse hidden md:block" />
                <div className="h-4 w-24 bg-slate-200/60 rounded animate-pulse" />
              </div>
              {/* Rows Skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center px-4 py-4 gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2 hidden md:block">
                    <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="w-24">
                    <div className="h-6 w-full bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="w-16 hidden sm:block">
                    <div className="h-6 w-full bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="w-20 hidden lg:block">
                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-12 text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="relative w-20 h-20 rounded-2xl bg-primary flex items-center justify-center ring-1 ring-primary/20 shadow-lg shadow-primary/20">
              <Users className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-tight">No leads {status ? `in ${status.replace(/_/g, ' ')}` : 'yet'}</h2>
          <p className="mt-2.5 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Buyers who fill the contact form on your smart-link pages appear here. Share your properties to generate leads!
          </p>
          {!status && (
            <div className="mt-7">
              <Link href="/properties" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-semibold shadow-md shadow-primary/20 transition-all">
                Share Properties
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD FLAT TABLE DISPLAY */
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase border-b bg-slate-50">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Lead</th>
                  <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Property</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3 hidden sm:table-cell">Score</th>
                  <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-4 py-3.5">
                      <Link href={`/leads/${lead.id}`} className="block">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{lead.name ?? '(unnamed)'}</p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="truncate max-w-xs">{lead.property?.title ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{lead.property?.location?.city ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <LeadStatusPill status={lead.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <HotScoreChip score={lead.hotScore} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-muted-foreground">
                      {timeAgo(lead.lastActivityAt ?? lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function StatusChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors text-sm ${
        active
          ? 'border-primary bg-primary text-white font-medium'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
      }`}
    >
      <span className="capitalize">{label.toLowerCase()}</span>
      <span className={`px-1.5 rounded-md text-xs font-bold ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
        {value}
      </span>
    </button>
  );
}
