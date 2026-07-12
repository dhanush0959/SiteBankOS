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
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  MapPin, 
  IndianRupee,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { formatINR } from '@/lib/property-helpers';

interface AdminProperty {
  id: string;
  title: string;
  propertyType: string;
  price: string;
  location: {
    city: string;
    address: string;
  };
  verificationStatus: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function AdminPropertiesPage() {
  const api = useApi();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'properties', search],
    queryFn: async () => unwrap<{ items: AdminProperty[] }>(await api.get('/admin/properties', { params: { search: search || undefined } })),
  });

  const verify = useMutation({
    mutationFn: (id: string) => api.post(`/admin/properties/${id}/verify`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      toast({ title: 'Property verified successfully' });
    },
  });

  const reject = useMutation({
    mutationFn: (vars: { id: string, reason: string }) => api.post(`/admin/properties/${vars.id}/reject`, { reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      toast({ title: 'Property verification rejected' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Property Verification</h1>
          <p className="text-muted-foreground mt-1">Review and verify property listings for quality assurance.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Search title, city or owner..." 
            className="pl-10 h-12 rounded-2xl border-0 shadow-premium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          data?.items.map((prop) => (
            <Card key={prop.id} className="border-0 shadow-premium rounded-3xl overflow-hidden group hover:shadow-premium-hover transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Info Section */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {prop.propertyType.replace(/_/g, ' ')}
                          </Badge>
                          <Badge 
                            className={`rounded-full px-2.5 ${
                              prop.verificationStatus === 'VERIFIED' ? 'bg-emerald-500 hover:bg-emerald-600' :
                              prop.verificationStatus === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600' :
                              'bg-amber-500 hover:bg-amber-600'
                            }`}
                          >
                            {prop.verificationStatus}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold group-hover:text-accent transition-colors">{prop.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {prop.location.city}</span>
                          <span className="flex items-center gap-1.5 font-bold text-foreground"><IndianRupee className="h-4 w-4" /> {formatINR(prop.price)}</span>
                        </div>
                      </div>
                      <a 
                        href={`/p/${prop.id}`} 
                        target="_blank" 
                        className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-accent hover:text-white transition-all duration-300 shadow-inner"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">
                          {prop.owner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight">{prop.owner.name}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{prop.owner.email}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {prop.verificationStatus !== 'VERIFIED' && (
                          <Button 
                            variant="ghost"
                            onClick={() => verify.mutate(prop.id)}
                            disabled={verify.isPending}
                            className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-emerald-600/80 h-11 px-6 font-bold"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
                          </Button>
                        )}
                        {prop.verificationStatus !== 'REJECTED' && (
                          <Button 
                            variant="ghost"
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) reject.mutate({ id: prop.id, reason });
                            }}
                            disabled={reject.isPending}
                            className="rounded-xl hover:bg-rose-50 hover:text-rose-600 text-rose-600/80 h-11 px-6 font-bold"
                          >
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-inner">
            <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-400">No properties found</h3>
            <p className="text-slate-400 max-w-xs mx-auto mt-2">Try adjusting your search filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
