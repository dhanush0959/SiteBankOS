'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { unwrap } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, ShieldAlert, ShieldCheck, UserMinus, UserPlus, Loader2, Mail, Phone } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: {
    properties: number;
    leads: number;
  };
}

export default function AdminUsersPage() {
  const api = useApi();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => unwrap<{ items: AdminUser[] }>(await api.get('/admin/users', { params: { search: search || undefined } })),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User suspended' });
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User activated' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform access and roles for all users.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Search name, email or phone..." 
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
          data?.items.map((user) => (
            <Card key={user.id} className="border-0 shadow-premium rounded-3xl overflow-hidden group hover:shadow-premium-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                      user.role === 'SUPER_ADMIN' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'} className="rounded-full px-2.5">
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                        {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                        <span className="font-semibold text-accent uppercase tracking-tighter">{user.role.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 lg:gap-12 text-center lg:text-left border-t lg:border-t-0 pt-4 lg:pt-0">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Properties</p>
                      <p className="text-xl font-bold">{user._count.properties}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Leads</p>
                      <p className="text-xl font-bold">{user._count.leads}</p>
                    </div>
                    <div className="flex gap-2">
                      {user.status === 'ACTIVE' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => suspend.mutate(user.id)}
                          disabled={suspend.isPending || user.role === 'SUPER_ADMIN'}
                          className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-destructive/80 h-10 px-4"
                        >
                          <UserMinus className="h-4 w-4 mr-2" /> Suspend
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => activate.mutate(user.id)}
                          disabled={activate.isPending}
                          className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-emerald-600/80 h-10 px-4"
                        >
                          <UserPlus className="h-4 w-4 mr-2" /> Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <UserMinus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
