import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In | SiteBank' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      
      {/* Dynamic Animated Background - Floating Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-blue-400/20 blur-[100px] animate-float mix-blend-multiply" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-indigo-400/10 blur-[80px] animate-pulse-slow mix-blend-multiply" style={{ animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-900">
              Site<span className="text-primary">Bank</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back.
          </h1>
          <p className="text-slate-500 text-base font-medium">
            Let's close some deals today. Sign in to your workspace.
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
