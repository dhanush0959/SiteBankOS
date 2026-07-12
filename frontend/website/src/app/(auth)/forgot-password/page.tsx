'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequestPasswordReset } from '@/hooks/useAuth';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const reset = useRequestPasswordReset();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We'll email you a link to reset it.
          </p>
        </div>
        <Card>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await reset.mutateAsync(data.email).catch(() => null);
              setSubmitted(true);
            })}
          >
            <CardHeader className="pb-0" />
            <CardContent className="pt-6 space-y-4">
              {submitted ? (
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a reset link is on the way. Check your inbox (and spam) within a minute.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register('email')} placeholder="agent@example.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {!submitted && (
                <Button type="submit" className="w-full" disabled={reset.isPending}>
                  {reset.isPending ? 'Sending…' : 'Send reset link'}
                </Button>
              )}
              <p className="text-sm text-muted-foreground text-center">
                <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
