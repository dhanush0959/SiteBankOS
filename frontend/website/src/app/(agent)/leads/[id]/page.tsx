'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Phone, MessageSquare, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useLead,
  useUpdateLead,
  useDeleteLead,
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  type LeadStatus,
} from '@/hooks/useLeads';
import { LeadStatusPill, HotScoreChip } from '@/components/leads/lead-status-pill';
import { timeAgo } from '@/lib/property-helpers';

const STATUS_FLOW: LeadStatus[] = ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'NEGOTIATING', 'CLOSED'];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const { data: lead, isLoading } = useLead(id);
  const update = useUpdateLead(id);
  const del = useDeleteLead();
  const reminders = useReminders(id);
  const createReminder = useCreateReminder(id);
  const updateReminder = useUpdateReminder();

  const [notes, setNotes] = useState<string | null>(null);
  const [remindAt, setRemindAt] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  if (isLoading || !lead) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="h-6 w-24 bg-muted/40 rounded-lg animate-pulse" />
        <div className="h-40 bg-muted/30 rounded-2xl animate-pulse" />
        <div className="h-24 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const notesValue = notes ?? lead.notes ?? '';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> All leads
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/30"
          onClick={() => {
            if (!confirm('Delete this lead?')) return;
            del.mutate(id, {
              onSuccess: () => {
                toast({ title: 'Deleted' });
                router.push('/leads');
              },
            });
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{lead.name ?? '(unnamed lead)'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Source: <span className="font-medium">{lead.source ?? '—'}</span> · Created {timeAgo(lead.createdAt)}
              </p>
            </div>
            <HotScoreChip score={lead.hotScore} />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <LeadStatusPill status={lead.status} />
            {lead.phone && (
              <>
                <a
                  href={`tel:+91${String(lead.phone).replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" /> {lead.phone}
                </a>
                <a
                  href={`https://wa.me/91${String(lead.phone).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
          </div>
          {lead.property && (
            <Link href={`/properties/${lead.property.id}`} className="block rounded-md border bg-muted/20 p-3 hover:bg-muted/30">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Interested in</p>
              <p className="font-medium mt-0.5">{lead.property.title}</p>
              <p className="text-xs text-muted-foreground">{lead.property.location?.city}</p>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="font-semibold">Move to next stage</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  update.mutate(
                    { status: s },
                    { onSuccess: () => toast({ title: `Status → ${s.replace(/_/g, ' ')}` }) },
                  );
                }}
                disabled={lead.status === s}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  lead.status === s
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card hover:bg-muted/40'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="font-semibold">Notes</h2>
          <textarea
            value={notesValue}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if ((notes ?? lead.notes ?? '') !== (lead.notes ?? '')) {
                update.mutate({ notes: notes ?? '' });
              }
            }}
            rows={4}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            placeholder="Conversation notes, follow-up plans, buyer preferences…"
          />
          <p className="text-xs text-muted-foreground">Auto-saves on blur.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="font-semibold">Reminders</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!remindAt) return;
              createReminder.mutate(
                { remindAt: new Date(remindAt).toISOString(), note: reminderNote || undefined },
                {
                  onSuccess: () => {
                    setRemindAt('');
                    setReminderNote('');
                    toast({ title: 'Reminder set' });
                  },
                },
              );
            }}
            className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-end"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">When</Label>
              <Input
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional)</Label>
              <Input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} placeholder="Site visit confirmation" />
            </div>
            <Button type="submit" size="sm" disabled={createReminder.isPending}>Add</Button>
          </form>

          {reminders.data && reminders.data.length > 0 ? (
            <ul className="divide-y border-t">
              {reminders.data.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{new Date(r.remindAt).toLocaleString('en-IN')}</p>
                    {r.note && <p className="text-xs text-muted-foreground truncate">{r.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-medium text-muted-foreground">{r.status}</span>
                    {r.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReminder.mutate({ id: r.id, status: 'DONE' })}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No reminders set.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
