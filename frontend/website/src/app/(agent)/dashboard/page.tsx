'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Building2,
  Eye,
  Users,
  X,
  Flame,
  Phone,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardAnalytics, useAgencyAnalytics, type Range } from '@/hooks/useAnalytics';
import { useLeadStats, useLeads } from '@/hooks/useLeads';
import { useMe } from '@/hooks/useAuth';
import { DualLineChart } from '@/components/dashboard/sparkline';
import { formatNumber } from '@/lib/property-helpers';

export default function DashboardPage() {
  const { data: me } = useMe();
  const [range, setRange] = useState<Range>('30d');
  const [tab, setTab] = useState<'personal' | 'agency'>('personal');
  const [showHotLeadsDrawer, setShowHotLeadsDrawer] = useState(false);
  
  const personal = useDashboardAnalytics(range);
  const agency = useAgencyAnalytics(range);
  
  const isAgencyAdmin = me?.role === 'AGENCY_ADMIN';
  const activeData = (isAgencyAdmin && tab === 'agency') ? agency.data : personal.data;
  const isLoading = (isAgencyAdmin && tab === 'agency') ? agency.isLoading : personal.isLoading;

  const { data: leadStats } = useLeadStats();
  const { data: leadsPage, isLoading: isLoadingLeads } = useLeads({ pageSize: 100 });

  // Filter hot leads (hotScore >= 7) and group them by interested property
  const hotLeadsList = (leadsPage && leadsPage.items) ? leadsPage.items.filter(function(lead) { return lead.hotScore > 6; }) : [];
  const hotLeadsByProperty: any = {};
  hotLeadsList.forEach((lead) => {
    const propertyId = lead.propertyId || 'other';
    const propertyTitle = lead.property?.title || 'General / Inbound Leads';
    if (!hotLeadsByProperty[propertyId]) {
      hotLeadsByProperty[propertyId] = {
        title: propertyTitle,
        leads: [],
      };
    }
    hotLeadsByProperty[propertyId].leads.push(lead);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {isAgencyAdmin && (
            <div className="flex bg-muted p-1 rounded-lg w-fit">
              <button 
                onClick={() => setTab('personal')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${tab === 'personal' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Personal
              </button>
              <button 
                onClick={() => setTab('agency')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${tab === 'agency' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Agency Team
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground hidden md:block italic">
            Showing {tab === 'personal' ? 'your' : 'the team\'s'} activity
          </p>
          <RangeToggle value={range} onChange={setRange} />
        </div>
      </div>

      <div className="flex bg-white rounded-lg border border-slate-200 divide-x divide-slate-100 shadow-sm overflow-hidden">
        <Kpi 
          icon={Building2} 
          label={tab === 'personal' ? "Properties" : "Team Properties"} 
          value={activeData?.totals.activeProperties ?? '—'} 
          hint={`${activeData?.totals.properties ?? 0} total listings`} 
        />
        <Kpi 
          icon={Eye} 
          label={tab === 'personal' ? "Views" : "Team Views"} 
          value={formatNumber(activeData?.totals.totalViews ?? 0)} 
          hint={`${formatNumber(activeData?.totals.uniqueVisitors ?? 0)} unique visitors`} 
        />
        <Kpi
          icon={Users}
          label={tab === 'personal' ? "Hot Leads" : "Team Hot Leads"}
          value={activeData?.totals.hotLeads ?? '—'}
          hint={`${tab === 'personal' ? leadStats?.total ?? 0 : activeData?.totals.leads ?? 0} total leads`}
          onClick={() => setShowHotLeadsDrawer(true)}
        />
      </div>

      <div className="space-y-3 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Activity over time</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary" /> Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-500" /> Leads
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="h-40 bg-muted/20 rounded animate-pulse" />
        ) : (
          <DualLineChart data={activeData?.timeseries ?? []} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div className="space-y-4">
          <h2 className="font-semibold">Conversion funnel</h2>
          <FunnelStep label="Views" value={activeData?.funnel.views ?? 0} max={activeData?.funnel.views ?? 1} color="bg-primary" />
          <FunnelStep label="Contact clicks" value={activeData?.funnel.contactClicks ?? 0} max={activeData?.funnel.views ?? 1} color="bg-primary" />
          <FunnelStep label="Lead submissions" value={activeData?.funnel.leadSubmissions ?? 0} max={activeData?.funnel.views ?? 1} color="bg-emerald-500" />
          <p className="text-sm text-muted-foreground mt-3">
            Conversion: <span className="font-medium text-foreground">{(activeData?.funnel.conversionPct ?? 0).toFixed(1)}%</span>
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Top properties</h2>
            <Link href="/properties" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {!activeData || activeData.topProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity in this range yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {activeData.topProperties.map((p) => (
                <li key={p.propertyId} className="py-2 flex items-center justify-between gap-3">
                  <Link href={`/properties/${p.propertyId}`} className="truncate hover:underline">
                    {p.title}
                  </Link>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {formatNumber(p.views)} <span className="text-xs">views</span> · {p.leads} <span className="text-xs">leads</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Hot Leads Sliding Drawer */}
      {showHotLeadsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-300 animate-fade-in"
            onClick={() => setShowHotLeadsDrawer(false)}
          />

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-background border-l border-border/80 shadow-2xl flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-foreground">
                    <Flame className="h-4 w-4 fill-foreground animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Hot Leads Breakdown</h2>
                    <p className="text-xs text-muted-foreground">Grouped by interested property</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-muted/80 text-muted-foreground"
                  onClick={() => setShowHotLeadsDrawer(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingLeads ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ) : Object.keys(hotLeadsByProperty).length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold">No Hot Leads Found</p>
                    <p className="text-xs text-muted-foreground px-4">Leads with higher engagement and contact status will appear here.</p>
                  </div>
                ) : (
                  Object.entries(hotLeadsByProperty).map(([propertyId, group]: any) => (
                    <div key={propertyId} className="space-y-3 border-b border-border/40 pb-5 last:border-0 last:pb-0 animate-fade-in">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {propertyId === 'other' ? (
                            <h3 className="font-semibold text-sm text-foreground">{group.title}</h3>
                          ) : (
                            <Link
                              href={`/properties/${propertyId}`}
                              className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                              onClick={() => setShowHotLeadsDrawer(false)}
                            >
                              {group.title}
                              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-all shrink-0" />
                            </Link>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-foreground border border-foreground/20">
                          {group.leads.length} {group.leads.length === 1 ? 'Lead' : 'Leads'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {group.leads.map((lead: any) => (
                          <div
                            key={lead.id}
                            className="bg-card hover:bg-muted/30 transition-all p-3 rounded-xl border border-border/60 shadow-sm relative group/item"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{lead.name || 'Anonymous User'}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{lead.phone || 'No phone number'}</p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wide">
                                  {lead.status}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase tracking-wide">
                                  Score: {lead.hotScore}
                                </span>
                              </div>
                            </div>

                            {/* Contact Action Bar */}
                            {lead.phone && (
                              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/40 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-1 rounded-lg border border-border/60 hover:border-emerald-500/30"
                                  asChild
                                >
                                  <a
                                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageSquare className="h-3 w-3 fill-current" /> WhatsApp
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1 rounded-lg border border-border/60 hover:border-blue-500/30"
                                  asChild
                                >
                                  <a href={`tel:${lead.phone}`}>
                                    <Phone className="h-3 w-3" /> Call
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-5 text-center transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-50' : ''
      }`}
    >
      <span className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{value}</span>
      <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1.5 px-1 truncate w-full text-center">
        {label}
      </span>
      {hint && <span className="hidden sm:block text-[10px] text-slate-400 mt-1">{hint}</span>}
    </div>
  );
}

function FunnelStep({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{value.toLocaleString('en-IN')}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const options: Range[] = ['7d', '30d', '90d'];
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            value === opt ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
