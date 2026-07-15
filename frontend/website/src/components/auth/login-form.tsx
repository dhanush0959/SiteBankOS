'use client';
import { useEffect, useState, useRef } from 'react';
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
import { setAccessToken, getAccessToken } from '@/lib/auth';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Preloader } from '@/components/shared/preloader';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const qc = useQueryClient();

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  // Spotlight & Parallax State
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });

    // Parallax calculation (max 5 degrees rotation)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    setCardRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCardRotation({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Silent refresh on mount
  useEffect(() => {
    async function checkExistingSession() {
      const existingToken = getAccessToken();
      const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';
      
      try {
        // If we don't have a token, try to refresh via cookie
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const payload = res.data?.data ?? res.data;
        if (payload?.accessToken) {
          setAccessToken(payload.accessToken);
          router.replace('/properties');
          return;
        }
      } catch {
        // If refresh fails, they really need to log in
      } finally {
        setInitialChecking(false);
      }
    }
    
    checkExistingSession();
  }, [router]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';
      const res = await axios.post(
        `${API_URL}/auth/login`,
        data,
        { withCredentials: true },
      );
      const payload = res.data?.data ?? res.data;
      setAccessToken(payload.accessToken);
      qc.clear(); // Wipe residual cache
      router.push('/properties');
    } catch (err: unknown) {
      let msg = 'Login failed. Check your credentials.';
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
      toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      setLoading(false);
    }
  }

  if (initialChecking) {
    return (
      <Card className="border border-border shadow-sm rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground animate-pulse">Restoring session...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Preloader isVisible={loading} message="Signing you in..." />
      <div className="relative group w-full" style={{ perspective: '1000px' }}>
        <Card 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className="border border-border shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl relative overflow-hidden"
          style={{
            transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg) scale(${isHovered ? 1.02 : 1})`,
            transition: isHovered ? 'none' : 'transform 0.5s ease-out',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Spotlight Effect */}
          <div 
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
            style={{
              background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.12), transparent 40%)`
            }}
          />
          
          <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder=" "
                {...form.register('email')}
                className="peer rounded-xl h-12 bg-slate-50 border-slate-200 placeholder-transparent focus:ring-primary/20 focus:border-primary px-4 pt-4 pb-1 transition-all"
              />
              <Label 
                htmlFor="email" 
                className="absolute left-4 top-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:font-bold peer-focus:text-primary flex items-center gap-1.5 pointer-events-none"
              >
                Email
              </Label>
              {form.formState.errors.email && (
                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder=" "
                {...form.register('password')}
                className="peer rounded-xl h-12 bg-slate-50 border-slate-200 placeholder-transparent focus:ring-primary/20 focus:border-primary px-4 pt-4 pb-1 transition-all"
              />
              <Label 
                htmlFor="password" 
                className="absolute left-4 top-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:font-bold peer-focus:text-primary flex items-center gap-1.5 pointer-events-none"
              >
                Password
              </Label>
              {form.formState.errors.password && (
                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-6">
            <Button
              type="submit"
              className="w-full rounded-xl h-12 bg-primary text-white hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/25 active:scale-[0.98]"
              disabled={loading}
            >
              Sign In
            </Button>
            <p className="text-sm text-center">
              <Link href="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </p>
            <div className="h-px bg-border w-full my-2" />
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              Agent & Agency Login
            </p>
            <p className="text-sm text-muted-foreground text-center">
              No account?{' '}
              <Link href="/register" className="text-primary hover:underline font-semibold">
                Create one free
              </Link>
            </p>
          </CardFooter>
        </form>
        </div>
      </Card>
      </div>
    </>
  );
}
