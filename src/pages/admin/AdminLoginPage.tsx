import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, LayoutDashboard, Lock, Mail, ShieldCheck, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, ButtonLink, Input, LogoMark } from '@/components/common';
import { useDocumentTitle } from '@/hooks';
import { authService } from '@/services';
import { toast, useAuthStore } from '@/store';
import { storefrontUrl } from '@/config/storefront';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

const ERRORS: Record<string, string> = {
  'errors.invalidCredentials': 'Email or password is incorrect, or this account is not an admin.',
  'errors.tooManyAttempts': 'Too many sign-in attempts. Please wait a few minutes and try again.',
  'errors.network': 'Cannot reach the server. Is the backend running?',
};

export default function AdminLoginPage() {
  useDocumentTitle('Admin sign in');
  const admin = useAuthStore((s) => s.admin);
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const redirect = params.get('redirect')?.startsWith('/admin') ? params.get('redirect')! : '/admin';
  if (admin) return <Navigate to={redirect} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      const session = await authService.adminLogin(email, password);
      setAdmin(session);
      toast.success(`Welcome back, ${session.name.split(' ')[0]}.`);
      navigate(redirect, { replace: true });
    } catch (e) {
      setFormError(ERRORS[e instanceof Error ? e.message : ''] ?? 'Sign-in failed. Please try again.');
    }
  });

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <LogoMark tone="light" className="h-10 w-10" />
          <span className="font-display text-2xl font-semibold text-cream">
            KitchenScale<span className="text-accent italic">Co</span>
          </span>
        </div>
        <div className="relative">
          <div className="mb-10 aspect-video w-full overflow-hidden rounded-xl3 shadow-lift">
            <img
              src="/images/client/shopify-coffee-hero.png"
              alt="KitchenScaleCo digital spoon scale measuring coffee into a cup"
              className="h-full w-full object-cover"
              fetchPriority="high"
              width={1024}
              height={1024}
            />
          </div>
          <p className="eyebrow mb-3">Store admin</p>
          <h2 className="max-w-md text-4xl leading-tight text-cream">Run the store behind every precise scoop.</h2>
          <p className="mt-4 max-w-md text-cream/70">
            Products, orders, customers, coupons, reviews, marketing and settings — all in one calm workspace.
          </p>
        </div>
        <p className="relative text-xs text-cream/50">Authorised staff only</p>
      </div>

      {/* Entry panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="h-10 w-10" />
            <span className="font-display text-2xl font-semibold text-primary">
              KitchenScale<span className="text-primary-700 italic">Co</span>
            </span>
          </div>
          <div className="rounded-xl3 border border-line/80 bg-surface p-7 shadow-soft sm:p-9">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <LayoutDashboard className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="text-3xl font-semibold">Admin dashboard</h1>
            <p className="mt-2 text-muted">Sign in with your admin account to manage the store.</p>

            <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
              {formError && (
                <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {formError}
                </p>
              )}
              <Button type="submit" size="lg" fullWidth loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Sign in
              </Button>
            </form>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              Admin accounts are verified by the server, and every admin request is checked for the admin role.
            </p>
          </div>
          <div className="mt-6 text-center">
            <ButtonLink to={storefrontUrl('/')} variant="ghost" size="sm" leftIcon={<Store className="h-4 w-4" />}>
              Back to the storefront
            </ButtonLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
