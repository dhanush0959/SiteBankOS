'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useConfirmEmailVerification } from '@/hooks/useAuth';

function VerifyInner() {
  const search = useSearchParams();
  const token = search.get('token');
  const confirm = useConfirmEmailVerification();
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    confirm
      .mutateAsync(token)
      .then(() => setState('ok'))
      .catch(() => setState('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-3">
        {state === 'pending' && (
          <>
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600" />
            <h1 className="text-xl font-semibold">Email verified</h1>
            <p className="text-sm text-muted-foreground">You're all set.</p>
            <Link href="/dashboard" className="inline-block mt-2 text-primary hover:underline">
              Go to dashboard
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="text-xl font-semibold">Verification failed</h1>
            <p className="text-sm text-muted-foreground">
              The link may have expired or already been used.
            </p>
            <Link href="/login" className="inline-block mt-2 text-primary hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Loading…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
