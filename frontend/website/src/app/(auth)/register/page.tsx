import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Create Account | SiteBank' };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50/50 relative overflow-hidden">
      <div className="w-full max-w-[400px] animate-fade-in z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Site<span className="text-accent">Bank</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-slate-500 text-sm">
            Get started with your free agent workspace
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
}

