'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Shield, Mail, Phone, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { unwrap } from '@/lib/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  reraNumber?: string | null;
  profilePhotoUrl?: string | null;
  isVerified: boolean;
  role: string;
}

export default function ProfilePage() {
  const api = useApi();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => unwrap<UserProfile>(await api.get('/users/me')),
  });

  const update = useMutation({
    mutationFn: async (vars: Partial<UserProfile>) =>
      unwrap<UserProfile>(await api.patch('/users/me', vars)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast({ title: 'Profile saved' });
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return unwrap<UserProfile>(
        await api.patch('/users/me/photo', fd)
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast({ title: 'Photo updated' });
    },
  });

  const [form, setForm] = useState({ name: '', phone: '', whatsappNumber: '', reraNumber: '' });

  useEffect(() => {
    if (me) {
      setForm({
        name: me.name ?? '',
        phone: me.phone ?? '',
        whatsappNumber: me.whatsappNumber ?? '',
        reraNumber: me.reraNumber ?? '',
      });
    }
  }, [me]);

  if (isLoading || !me) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-fade-in px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Profile Settings
        </h1>
      </div>

      {/* Profile Header Card */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card">
        {/* Cover Photo Area */}
        <div className="h-32 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
        </div>
        
        <CardContent className="pt-0 relative px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="-mt-12 relative group z-10 shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl bg-card overflow-hidden ring-4 ring-background shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                {me.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.profilePhotoUrl} alt={me.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-primary text-white">
                    {me.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto.mutate(f);
                }}
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 pb-1">
              <h2 className="font-bold text-2xl tracking-tight">{me.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4 opacity-70" />
                {me.email}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {me.role.replace(/_/g, ' ')}
                </span>
                {me.isVerified ? (
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1 uppercase tracking-wider">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Form */}
      <Card className="border-0 shadow-premium overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Personal Details</h2>
              <p className="text-sm text-muted-foreground">Manage your contact and registration information.</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  WhatsApp Number
                </Label>
                <Input
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                  placeholder="+91"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RERA Registration (Optional)</Label>
              <Input
                value={form.reraNumber}
                onChange={(e) => setForm({ ...form, reraNumber: e.target.value })}
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => update.mutate(form)}
              disabled={update.isPending}
              className="h-11 px-8 rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-semibold"
            >
              {update.isPending ? 'Saving Changes…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

