'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { unwrap } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Building2, UserMinus, UserPlus, Loader2, MapPin, Globe } from 'lucide-react';

interface AdminAgency {
  id: string;
  name: string;
  address: string | null;
  customDomain: string | null;
  status: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function AdminAgenciesPage() {
  const api = useApi();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'agencies', search],
    queryFn: async () => unwrap<{ items: AdminAgency[] }>(await api.get('/admin/agencies', { params: { search: search || undefined } })),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.post(`/admin/agencies/${id}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      toast({ title: 'Agency suspended' });
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/admin/agencies/${id}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      toast({ title: 'Agency activated' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage real estate agencies on the platform.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Search agency name or domain..." 
            className="pl-10 h-12 rounded-2xl border-0 shadow-premium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          data?.items.map((agency) => (
            <Card key={agency.id} className="border-0 shadow-premium rounded-3xl overflow-hidden group hover:shadow-premium-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{agency.name}</h3>
                        <Badge variant={agency.status === 'ACTIVE' ? 'success' : 'destructive'} className="rounded-full px-2.5">
                          {agency.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {agency.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {agency.address}</span>}
                        {agency.customDomain && <span className="flex items-center gap-1 text-accent font-semibold"><Globe className="h-3.5 w-3.5" /> {agency.customDomain}</span>}
                        <span className="font-medium text-slate-400">Owner: {agency.owner.name} ({agency.owner.email})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0">
                    {agency.status === 'ACTIVE' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => suspend.mutate(agency.id)}
                        disabled={suspend.isPending}
                        className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-destructive/80 h-10 px-4"
                      >
                        <UserMinus className="h-4 w-4 mr-2" /> Suspend
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => activate.mutate(agency.id)}
                        disabled={activate.isPending}
                        className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-emerald-600/80 h-10 px-4"
                      >
                        <UserPlus className="h-4 w-4 mr-2" /> Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No agencies found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
