'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

export function LeadForm({ slug, propertyTitle }: { slug: string; propertyTitle: string }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const idempotencyKeyRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/leads/public`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKeyRef.current,
          'x-protocol-version': 'v1'
        },
        body: JSON.stringify({ slug, name, phone, message: message || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      toast({ title: 'Request Sent!', description: 'The agent will reach out shortly.' });
    } catch {
      toast({
        title: 'Could not submit',
        description: 'Please try again or call the agent directly.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center shadow-sm animate-scale-in">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-emerald-800 dark:text-emerald-400">Thanks for your interest!</p>
        <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">The agent will get in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/80 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-300">
      <div>
        <h3 className="font-bold text-base text-foreground">Interested in this property?</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Share your details below and the agent will contact you shortly about <span className="font-semibold text-primary">{propertyTitle}</span>.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="text"
            required
            placeholder="Your name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full px-3.5 rounded-xl border border-border bg-background text-base md:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div>
          <input
            type="tel"
            required
            placeholder="Phone (with country code)"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full px-3.5 rounded-xl border border-border bg-background text-base md:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div>
          <textarea
            rows={3}
            placeholder="Message (optional)"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-base md:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending Request…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Request Callback
          </>
        )}
      </button>

      <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed">
        By submitting, you agree to be contacted by our registered agent regarding this property.
      </p>
    </form>
  );
}
