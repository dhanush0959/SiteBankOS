'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setAccessToken } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Preloader } from '@/components/shared/preloader';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  isAgency: z.boolean().default(false),
  agencyName: z.string().optional(),
}).refine((data) => !data.isAgency || (data.agencyName && data.agencyName.length >= 2), {
  message: "Agency name is required for agency accounts",
  path: ["agencyName"],
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      isAgency: false,
    }
  });

  const isAgency = form.watch('isAgency');

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';
      const res = await axios.post(
        `${API_URL}/auth/register`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          isAgency: data.isAgency,
          agencyName: data.agencyName,
        },
        { withCredentials: true },
      );
      const payload = res.data?.data ?? res.data;
      setAccessToken(payload.accessToken);
      qc.clear(); // Clear any existing cache to ensure a fresh state
      router.push('/properties');
    } catch (err: unknown) {
      let msg = 'Registration failed. Please try again.';
      if (axios.isAxiosError(err)) {
        const dataMsg = err.response?.data?.message;
        if (Array.isArray(dataMsg)) {
          msg = dataMsg.join(', ');
        } else if (typeof dataMsg === 'string') {
          msg = dataMsg;
        } else if (err.message) {
          msg = err.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      toast({ title: 'Registration failed', description: msg, variant: 'destructive' });
      setLoading(false);
    }
  }

  return (
    <>
      <Preloader isVisible={loading} message="Creating your workspace..." />
      <Card className="border border-border shadow-xl rounded-2xl bg-white dark:bg-card">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] border border-border/50 rounded-xl mb-4 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Register as Agency?</Label>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">For real estate companies</p>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-accent"
                {...form.register('isAgency')}
              />
            </div>

            {isAgency && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="agencyName" className="font-bold text-xs uppercase tracking-widest text-accent">Agency / Company Name</Label>
                <Input id="agencyName" placeholder="Skyline Realty Pvt Ltd" {...form.register('agencyName')} className="h-11 rounded-xl bg-slate-50 dark:bg-white/[0.02]" />
                {form.formState.errors.agencyName && (
                  <p className="text-sm text-destructive">{form.formState.errors.agencyName.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">Full Name</Label>
              <Input id="name" placeholder="Rajesh Kumar" {...form.register('name')} className="h-11 rounded-xl bg-slate-50 dark:bg-white/[0.02]" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input id="email" type="email" placeholder="agent@example.com" {...form.register('email')} className="h-11 rounded-xl bg-slate-50 dark:bg-white/[0.02]" />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold">Mobile Number (optional)</Label>
              <Input id="phone" type="tel" placeholder="9876543210" {...form.register('phone')} className="h-11 rounded-xl bg-slate-50 dark:bg-white/[0.02]" />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                {...form.register('password')}
                className="h-11 rounded-xl bg-slate-50 dark:bg-white/[0.02]"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-6">
            <Button type="submit" className="w-full h-11 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all font-semibold shadow-md active:scale-[0.98]" disabled={loading}>
              {isAgency ? 'Create Agency Account' : 'Create Free Account'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
