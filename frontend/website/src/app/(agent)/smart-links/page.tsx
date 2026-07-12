'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Copy, RefreshCw, Power, Trash2, Eye, ExternalLink, Share2, Link2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useSmartLinks,
  useCreateSmartLink,
  useUpdateSmartLink,
  useDeleteSmartLink,
  useRegenerateSmartLink,
} from '@/hooks/useSmartLinks';
import { useProperties } from '@/hooks/useProperties';
import { timeAgo } from '@/lib/property-helpers';

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

export default function SmartLinksPage() {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useSmartLinks({ pageSize: 50 });
  const create = useCreateSmartLink();
  const del = useDeleteSmartLink();
  const regen = useRegenerateSmartLink();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            Smart Links
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shareable property microsites with built-in lead capture and analytics.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Link
        </Button>
      </div>

      {creating && (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreate={async (vars) => {
            try {
              const link = await create.mutateAsync(vars);
              setCreating(false);
              toast({ title: 'Link created', description: `/p/${link.slug}` });
            } catch {
              toast({ title: 'Failed to create', variant: 'destructive' });
            }
          }}
          busy={create.isPending}
        />
      )}

      <Card className="border-0 shadow-premium overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3">
                <Link2 className="h-7 w-7 text-primary/50" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                No smart links yet. Create one to share a property with buyers via WhatsApp or social.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.items.map((link, i) => {
                const fullUrl = `${APP_URL}/p/${link.slug}`;
                return (
                  <li
                    key={link.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/20 transition-colors animate-slide-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        <p className="font-semibold truncate">
                          {link.property?.title ?? 'Property'}
                        </p>
                        <StatusBadge status={link.status} />
                      </div>
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1 ml-6"
                      >
                        {fullUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Created {timeAgo(link.createdAt)} · {link.shareCount} share{link.shareCount === 1 ? '' : 's'}
                        {link.expiryAt && ` · expires ${new Date(link.expiryAt).toLocaleDateString('en-IN')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(fullUrl);
                          toast({ title: 'Copied', description: fullUrl });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <ToggleButton id={link.id} status={link.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          if (!confirm('Generate a new slug? The old URL will stop working.')) return;
                          regen.mutate(link.id, { onSuccess: () => toast({ title: 'Slug regenerated' }) });
                        }}
                        title="Regenerate slug"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        title="View analytics"
                        className="rounded-lg"
                      >
                        <Link href={`/analytics?smartLinkId=${link.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/30"
                        onClick={() => {
                          if (!confirm('Delete this link?')) return;
                          del.mutate(link.id, { onSuccess: () => toast({ title: 'Deleted' }) });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'DISABLED' | 'EXPIRED' }) {
  const cls =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : status === 'EXPIRED'
        ? 'bg-primary text-foreground border-foreground/20'
        : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

function ToggleButton({ id, status }: { id: string; status: 'ACTIVE' | 'DISABLED' | 'EXPIRED' }) {
  const update = useUpdateSmartLink(id);
  const next = status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-lg"
      onClick={() => update.mutate({ status: next })}
      title={status === 'ACTIVE' ? 'Disable' : 'Enable'}
      disabled={status === 'EXPIRED'}
    >
      <Power className="h-3.5 w-3.5" />
    </Button>
  );
}

function CreateForm({
  onCancel,
  onCreate,
  busy,
}: {
  onCancel: () => void;
  onCreate: (vars: { propertyId: string; expiresInDays?: number; password?: string }) => void;
  busy: boolean;
}) {
  const props = useProperties({ status: 'ACTIVE', pageSize: 100 });
  const [propertyId, setPropertyId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Card className="border-0 shadow-premium overflow-hidden animate-scale-in">
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!propertyId) return;
            onCreate({
              propertyId,
              expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : undefined,
              password: password || undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="font-semibold">Create Smart Link</h2>
          </div>
          <div className="space-y-1.5">
            <Label>Property</Label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a property…</option>
              {props.data?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expires in (days, optional)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="No expiry"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password (optional)</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for public"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-lg">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || !propertyId}
              className="rounded-lg bg-primary text-primary-foreground shadow-md"
            >
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
