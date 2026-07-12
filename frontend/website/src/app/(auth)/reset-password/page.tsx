'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useConfirmPasswordReset } from '@/hooks/useAuth';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .max(128)
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Must include a letter and a number'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords must match' });

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const router = useRouter();
  const { toast } = useToast();
  const reset = useConfirmPasswordReset();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm text-destructive">Missing reset token.</p>
          <Link href="/forgot-password" className="text-primary text-sm hover:underline">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0" />
      <form
        onSubmit={form.handleSubmit(async (data) => {
          try {
            await reset.mutateAsync({ token, newPassword: data.newPassword });
            setDone(true);
            toast({ title: 'Password updated', description: 'You can sign in now.' });
            setTimeout(() => router.push('/login'), 1500);
          } catch {
            toast({
              title: 'Reset failed',
              description: 'The link may have expired. Request a new one.',
              variant: 'destructive',
            });
          }
        })}
      >
        <CardContent className="pt-6 space-y-4">
          {done ? (
            <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" {...form.register('newPassword')} />
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm</Label>
                <Input type="password" {...form.register('confirm')} />
                {form.formState.errors.confirm && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {!done && (
            <Button type="submit" className="w-full" disabled={reset.isPending}>
              {reset.isPending ? 'Updating…' : 'Update password'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
