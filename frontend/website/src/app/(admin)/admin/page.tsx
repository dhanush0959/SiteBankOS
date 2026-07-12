'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { unwrap } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Building2, 
  Home, 
  MousePointer2, 
  BarChart3, 
  UserCheck, 
  FileText 
} from 'lucide-react';

interface AdminStats {
  counts: {
    users: number;
    agencies: number;
    properties: number;
    leads: number;
    smartLinks: number;
    linkEvents: number;
  };
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  recentGrowth: {
    users7d: number;
    properties7d: number;
  };
}

export default function AdminDashboardPage() {
  const api = useApi();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => unwrap<AdminStats>(await api.get('/admin/stats')),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-white/10" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.counts.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Agencies', value: stats?.counts.agencies, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Properties', value: stats?.counts.properties, icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Leads', value: stats?.counts.leads, icon: UserCheck, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Smart Links', value: stats?.counts.smartLinks, icon: MousePointer2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Views', value: stats?.counts.linkEvents, icon: BarChart3, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time stats across the entire SiteBank network.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-premium overflow-hidden group hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <h3 className="text-3xl font-bold mt-1">{card.value?.toLocaleString() || 0}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="rounded-3xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" /> Growth (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="font-semibold">New Users</span>
              <span className="text-2xl font-bold text-blue-600">+{stats?.recentGrowth.users7d || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="font-semibold">New Properties</span>
              <span className="text-2xl font-bold text-emerald-600">+{stats?.recentGrowth.properties7d || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.byRole || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between group">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{role.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="h-1.5 bg-slate-100 rounded-full flex-1 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-1000 ease-out" 
                        style={{ width: `${(count / (stats?.counts.users || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
