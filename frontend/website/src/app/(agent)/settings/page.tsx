'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Script from 'next/script';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useChangePassword, useLogout } from '@/hooks/useAuth';
import { unwrap } from '@/lib/api';
import { formatINR } from '@/lib/property-helpers';
import { Settings, CreditCard, Shield, LogOut, Star, CheckCircle2, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceInr: string;
  limits: Record<string, number>;
  features: Record<string, boolean>;
}

interface MySubscription {
  id?: string;
  plan?: Plan | { name: string } | string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

interface CheckoutResponse {
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  planId?: string;
  name?: string;
  success?: boolean;
  message?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill: { name?: string; email?: string; contact?: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

function BillingHistory() {
  const api = useApi();

  const history = useQuery({
    queryKey: ['subscriptions', 'history'],
    queryFn: async () =>
      unwrap<
        Array<{
          id: string;
          razorpayPaymentId?: string;
          amountPaise: number;
          currency: string;
          status: string;
          createdAt: string;
          plan: { name: string };
        }>
      >(await api.get('/subscriptions/history')),
  });

  if (!history.data?.length) return null;

  return (
    <div className="py-6 border-b border-slate-200">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        Billing History
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs uppercase">
              <th className="text-left py-2.5 pr-3 font-semibold">Date</th>
              <th className="text-left py-2.5 pr-3 font-semibold">Plan</th>
              <th className="text-left py-2.5 pr-3 font-semibold">Amount</th>
              <th className="text-left py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.data.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-3">
                  {new Date(p.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 pr-3 font-medium">{p.plan.name}</td>
                <td className="py-3 pr-3 font-mono text-sm">
                  ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                </td>
                <td className="py-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      p.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : p.status === 'REFUNDED'
                          ? 'bg-primary text-white'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const { toast } = useToast();
  const changePassword = useChangePassword();
  const logout = useLogout();

  const plans = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: async () => unwrap<Plan[]>(await api.get('/subscriptions/plans')),
  });
  const me = useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: async () => unwrap<MySubscription>(await api.get('/subscriptions/me')),
  });

  const checkout = useMutation({
    mutationFn: async (planId: string) =>
      unwrap<CheckoutResponse>(await api.post('/subscriptions/checkout', { planId })),
  });

  const verify = useMutation({
    mutationFn: async (payload: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
      planId: string;
    }) => unwrap<{ success: boolean }>(await api.post('/subscriptions/verify', payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] });
      toast({ title: 'Payment confirmed!', description: 'Your subscription has been activated.' });
    },
    onError: () => {
      toast({ title: 'Payment verification failed', description: 'Contact support if the amount was deducted.', variant: 'destructive' });
    },
  });

  const cancel = useMutation({
    mutationFn: async () => api.post('/subscriptions/cancel'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] });
      toast({ title: 'Subscription cancelled' });
    },
  });

  const [pwd, setPwd] = useState({ current: '', next: '' });

  const currentPlanName =
    typeof me.data?.plan === 'string'
      ? me.data.plan
      : me.data?.plan && typeof me.data.plan === 'object' && 'name' in me.data.plan
        ? me.data.plan.name
        : 'Free';

  async function handleUpgrade(plan: Plan) {
    if (parseFloat(plan.priceInr) === 0) {
      // Free plan — call checkout directly (stub mode)
      const res = await checkout.mutateAsync(plan.id);
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['subscriptions', 'me'] });
        toast({ title: 'Plan switched to Free' });
      }
      return;
    }

    // Create Razorpay order
    const res = await checkout.mutateAsync(plan.id);
    if (!res.orderId || !res.keyId) {
      toast({ title: 'Payment gateway unavailable', description: res.message ?? 'Razorpay is not configured.', variant: 'destructive' });
      return;
    }

    // Open Razorpay checkout modal
    if (!window.Razorpay) {
      toast({ title: 'Razorpay SDK not loaded', description: 'Please refresh the page.', variant: 'destructive' });
      return;
    }

    const rzp = new window.Razorpay({
      key: res.keyId,
      amount: res.amount ?? 0,
      currency: res.currency ?? 'INR',
      name: 'SiteBank',
      description: `${plan.name} Plan`,
      order_id: res.orderId,
      handler: (paymentResponse: RazorpayPaymentResponse) => {
        verify.mutate({
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpaySignature: paymentResponse.razorpay_signature,
          planId: plan.id,
        });
      },
      prefill: {
        name: res.prefill?.name ?? '',
        email: res.prefill?.email ?? '',
        contact: res.prefill?.contact ?? '',
      },
      theme: { color: '#3b82f6' },
      modal: {
        ondismiss: () => {
          // User closed the modal without paying
        },
      },
    });

    rzp.on('payment.failed', () => {
      toast({ title: 'Payment failed', description: 'Please try again.', variant: 'destructive' });
    });

    rzp.open();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Settings
      </h1>

      {/* Current Plan */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-foreground" />
              Current Plan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{currentPlanName}</span>
              {me.data?.paymentStatus && ` · ${me.data.paymentStatus}`}
              {me.data?.endDate && ` · renews/expires ${new Date(me.data.endDate).toLocaleDateString('en-IN')}`}
            </p>
          </div>
          {me.data?.paymentStatus === 'ACTIVE' && (
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => {
              if (confirm('Cancel subscription? You will be downgraded to Free.')) cancel.mutate();
            }}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="py-6 border-b border-slate-200">
        <h2 className="font-semibold mb-4">Available Plans</h2>
        {plans.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.data?.map((plan) => {
              const isCurrent = plan.name === currentPlanName;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col transition-all duration-200 card-hover ${
                    isCurrent
                      ? 'border-primary/30 bg-primary/5 shadow-md'
                      : 'bg-card hover:border-primary/20'
                  }`}
                >
                  <p className="font-bold text-base">{plan.name}</p>
                  <p className="text-2xl font-bold mt-1.5">
                    {formatINR(plan.priceInr)}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-3 space-y-1.5 flex-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {plan.limits.properties === -1 ? 'Unlimited' : plan.limits.properties} properties
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {plan.limits.photosPerProperty === -1 ? 'Unlimited' : plan.limits.photosPerProperty} photos
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {plan.limits.thumbnailsPerMonth === -1 ? 'Unlimited' : plan.limits.thumbnailsPerMonth} thumbnails/mo
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {plan.limits.teamMembers > 1 ? `${plan.limits.teamMembers} team members` : 'Single user'}
                    </li>
                    {plan.features.aiDescription && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                        AI description
                      </li>
                    )}
                    {plan.features.aiPitch && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                        AI pitch & Q&A
                      </li>
                    )}
                    {plan.features.customBranding && (
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-purple-500 shrink-0" />
                        Custom branding
                      </li>
                    )}
                  </ul>
                  {!isCurrent ? (
                    <Button
                      size="sm"
                      className="mt-4 rounded-lg bg-primary text-primary-foreground shadow-md"
                      onClick={() => handleUpgrade(plan)}
                      disabled={checkout.isPending || verify.isPending}
                    >
                      {parseFloat(plan.priceInr) === 0 ? 'Switch' : 'Upgrade'}
                    </Button>
                  ) : (
                    <p className="text-xs text-primary font-semibold mt-4 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Current plan
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BillingHistory />

      {/* Security */}
      <div className="py-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold">Security</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!pwd.current || !pwd.next) return;
            changePassword.mutate(
              { currentPassword: pwd.current, newPassword: pwd.next },
              {
                onSuccess: () => {
                  toast({ title: 'Password changed' });
                  setPwd({ current: '', next: '' });
                },
                onError: () =>
                  toast({ title: 'Could not change password', description: 'Check your current password.', variant: 'destructive' }),
              },
            );
          }}
          className="space-y-3 max-w-sm"
        >
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              minLength={8}
              value={pwd.next}
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              required
              className="rounded-lg"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="rounded-lg"
            >
              {changePassword.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing…
                </>
              ) : (
                'Change password'
              )}
            </Button>
          </div>
        </form>
        <div className="border-t mt-8 pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">Sign out of all devices</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/30"
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
