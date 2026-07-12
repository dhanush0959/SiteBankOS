'use client';

import { useState } from 'react';
import { Lock, Building2 } from 'lucide-react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

interface PasswordGateProps {
  slug: string;
  onSuccess: (password: string) => void;
  error?: string;
}

export function PasswordGate({ slug, onSuccess, error }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true);
    setLocalError(null);

    try {
      const res = await fetch(`${API}/smart-links/${slug}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const json = (await res.json()) as { ok?: boolean };

      if (json.ok) {
        onSuccess(password);
      } else {
        setLocalError('Incorrect password. Please try again.');
      }
    } catch {
      setLocalError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Premium Sticky Header */}
      <header className="h-16 border-b border-slate-200/80 bg-white sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Site<span className="text-blue-600">Bank</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold">Password Required</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This property link is protected. Enter the password shared by the agent to view it.
          </p>

          {(localError) && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 py-2 px-3 rounded-md">
              {localError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full px-3 rounded-xl border text-center text-base md:text-sm"
              maxLength={100}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 shadow-md hover:shadow-lg shadow-blue-500/10 active:scale-[0.98]"
            >
              {busy ? 'Verifying…' : 'View Property'}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
