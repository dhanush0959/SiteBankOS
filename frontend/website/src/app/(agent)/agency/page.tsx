'use client';

import { useState } from 'react';
import { 
  useMyAgency, 
  useInviteMember, 
  useRemoveMember, 
  useUpdateAgency,
  useUploadAgencyLogo 
} from '@/hooks/useAgencies';
import { useMe } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Settings, 
  Trash2, 
  Mail, 
  MapPin, 
  Globe, 
  Upload,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function AgencyPage() {
  const { data: user } = useMe();
  const { data: agency, isLoading } = useMyAgency();
  const [activeTab, setActiveTab] = useState<'team' | 'settings'>('team');
  const { toast } = useToast();

  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const updateAgency = useUpdateAgency();
  const uploadLogo = useUploadAgencyLogo();

  const [inviteEmail, setInviteEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-center py-20">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold">No Agency Found</h2>
        <p className="text-muted-foreground">You are not part of any agency yet.</p>
      </div>
    );
  }

  const isOwner = user?.sub === agency.ownerUserId;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            {agency.logoUrl ? (
              <img src={agency.logoUrl} alt={agency.name} className="w-12 h-12 object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agency.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5" /> {agency.address || 'No address set'}
            </p>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Team
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="grid gap-6">
          {isOwner && (
            <Card className="border-0 shadow-premium rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Invite Team Member
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input 
                      placeholder="Enter agent's email address" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      inviteMember.mutate({ agencyId: agency.id, email: inviteEmail, role: 'AGENT' }, {
                        onSuccess: () => {
                          toast({ title: 'Invitation sent', description: `An invite was sent to ${inviteEmail}` });
                          setInviteEmail('');
                        },
                        onError: (err: any) => {
                          toast({ title: 'Invite failed', description: err.response?.data?.message || 'Check if user exists', variant: 'destructive' });
                        }
                      });
                    }}
                    disabled={inviteMember.isPending || !inviteEmail}
                    className="h-12 px-6 rounded-xl font-bold"
                  >
                    {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite Agent'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-1">Team Members ({agency.members.length})</h2>
            <div className="grid gap-4">
              {agency.members.map((member) => (
                <Card key={member.id} className="border-0 shadow-premium rounded-3xl group transition-all duration-300 hover:shadow-premium-hover">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{member.name}</p>
                          <Badge variant={member.status === 'ACTIVE' ? 'success' : 'outline'} className="text-[10px] rounded-full">
                            {member.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                      {isOwner && member.id !== user?.sub && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this member?')) {
                              removeMember.mutate({ agencyId: agency.id, userId: member.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-0 shadow-premium rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-lg">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Agency Name</Label>
                <Input 
                  defaultValue={agency.name} 
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="Official Agency Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Office Address</Label>
                <Input 
                  defaultValue={agency.address || ''} 
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="Full physical address"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Custom Domain (Optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      defaultValue={agency.customDomain || ''} 
                      className="h-11 pl-10 rounded-xl"
                      placeholder="properties.yourdomain.com"
                      disabled
                    />
                  </div>
                  <Badge variant="outline" className="h-11 px-4 rounded-xl flex items-center">Coming Soon</Badge>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end">
                <Button 
                  onClick={() => {
                    updateAgency.mutate({ id: agency.id, data: { name: agencyName || undefined, address: agencyAddress || undefined } }, {
                      onSuccess: () => toast({ title: 'Settings updated' })
                    });
                  }}
                  disabled={updateAgency.isPending}
                  className="rounded-xl font-bold px-8"
                >
                  {updateAgency.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium rounded-3xl overflow-hidden h-fit">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-lg">Branding</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-dashed border-slate-200 mx-auto flex items-center justify-center overflow-hidden">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors">
                    <Upload className="h-4 w-4" /> 
                    {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
                  </div>
                  <input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadLogo.mutate({ agencyId: agency.id, file });
                      }
                    }}
                  />
                </Label>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Square PNG or JPG (Max 2MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
