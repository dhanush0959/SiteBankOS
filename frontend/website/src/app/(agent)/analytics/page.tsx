'use client';

import { useState } from 'react';
import { BarChart3, Eye, Users, MousePointerClick, Timer, ArrowDown, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardAnalytics, usePropertyAnalytics, useLiveCounter, type Range } from '@/hooks/useAnalytics';
import { useProperties } from '@/hooks/useProperties';
import { DualLineChart } from '@/components/dashboard/sparkline';
import { formatNumber } from '@/lib/property-helpers';

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');
  const [propertyId, setPropertyId] = useState<string>('');

  const dashboard = useDashboardAnalytics(range);
  const property = usePropertyAnalytics(propertyId || undefined, range);
  const live = useLiveCounter(propertyId || undefined, 60);
  const props = useProperties({ pageSize: 100 });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live: <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-foreground">{live.data?.count ?? 0}</span>
            </span>{' '}
            events in the last 60 minutes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">All properties</option>
            {props.data?.items.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <RangeToggle value={range} onChange={setRange} />
        </div>
      </div>

      {propertyId ? (
        <PropertyView data={property.data} loading={property.isLoading} />
      ) : (
        <DashboardView data={dashboard.data} loading={dashboard.isLoading} />
      )}
    </div>
  );
}

function DashboardView({
  data,
  loading,
}: {
  data: ReturnType<typeof useDashboardAnalytics>['data'];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse shadow-premium" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={Eye}
          label="Views"
          value={formatNumber(data.totals.totalViews)}
          
        />
        <MetricCard
          icon={Users}
          label="Unique"
          value={formatNumber(data.totals.uniqueVisitors)}
          
        />
        <MetricCard
          icon={Users}
          label="Leads"
          value={data.totals.leads}
          
        />
        <MetricCard
          icon={Users}
          label="Hot leads"
          value={data.totals.hotLeads}
          
        />
      </div>
      <Card className="border-0 shadow-premium">
        <CardContent className="pt-6">
          <h2 className="font-semibold mb-3">Activity Timeline</h2>
          <DualLineChart data={data.timeseries} />
        </CardContent>
      </Card>
    </>
  );
}

function PropertyView({
  data,
  loading,
}: {
  data: ReturnType<typeof usePropertyAnalytics>['data'];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse shadow-premium" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Eye} label="Views" value={formatNumber(data.summary.views)}  />
        <MetricCard icon={Users} label="Unique" value={formatNumber(data.summary.uniqueVisitors)}  />
        <MetricCard icon={MousePointerClick} label="Contact clicks" value={data.summary.contactClicks}  />
        <MetricCard icon={Users} label="Leads" value={data.summary.leadSubmissions}  />
        <MetricCard icon={MousePointerClick} label="WhatsApp" value={data.summary.whatsappClicks}  />
        <MetricCard icon={MousePointerClick} label="Calls" value={data.summary.callClicks}  />
        <MetricCard icon={Timer} label="Avg time" value={`${data.summary.avgTimeOnPageSec ?? 0}s`}  />
        <MetricCard icon={ArrowDown} label="Scroll depth" value={`${data.summary.avgScrollDepthPct ?? 0}%`}  />
      </div>
      <Card className="border-0 shadow-premium">
        <CardContent className="pt-6">
          <h2 className="font-semibold mb-3">Activity Timeline</h2>
          <DualLineChart data={data.timeseries} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-premium card-hover">
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-3">Top Referrers</h2>
            {data.referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No referrer data yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.referrers.slice(0, 10).map((r, i) => (
                  <li key={`${r.referrer}-${i}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="truncate max-w-xs text-sm">{r.referrer || 'Direct'}</span>
                    <span className="font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-full text-xs">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Devices</h2>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{data.devices.length}</p>
                <p className="text-sm text-muted-foreground mt-1">unique device signatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  gradient?: string;
}) {
  return (
    <Card className="border-0 shadow-premium card-hover overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
            <p className="text-xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const options: Range[] = ['7d', '30d', '90d'];
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
            value === opt
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
