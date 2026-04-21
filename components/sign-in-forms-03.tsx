'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MovynLogo } from '@/app/components/MovynLogo';
import { AuthMarketingBackdrop } from '@/components/auth-marketing-backdrop';
import { cn } from '@/lib/utils';

export type SignInAccountTab = 'chiropractor' | 'patient';

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignInFormValues = z.infer<typeof formSchema>;

export type SignInForms03Props = {
  accountTab: SignInAccountTab;
  onAccountTabChange: (tab: SignInAccountTab) => void;
  onSubmit: (values: SignInFormValues) => void | Promise<void>;
  error: string | null;
  submitting: boolean;
  signUpHref: string;
};

export function SignInForms03({
  accountTab,
  onAccountTabChange,
  onSubmit,
  error,
  submitting,
  signUpHref,
}: SignInForms03Props) {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const email = form.watch('email');
  const forgotHref = `/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <AuthMarketingBackdrop>
      <Card className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 border-0 bg-card shadow-lg">
        <CardContent className="w-full space-y-8 pt-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <MovynLogo variant="standard" className="h-9 w-auto max-w-[200px]" />
            <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground [font-family:var(--font-display)] sm:text-3xl">
              Sign in to your account
            </h1>
          </div>

          <div
            className="mx-auto flex h-9 w-full max-w-[280px] items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={accountTab === 'chiropractor'}
              className={cn(
                'inline-flex flex-1 items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                accountTab === 'chiropractor'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onAccountTabChange('chiropractor')}
            >
              Chiropractor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={accountTab === 'patient'}
              className={cn(
                'inline-flex flex-1 items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                accountTab === 'patient'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onAccountTabChange('patient')}
            >
              Patient
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 text-left">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex w-full justify-between gap-2">
                      <span>Password</span>
                      <Link href={forgotHref} className="text-muted-foreground text-sm font-normal underline">
                        Forgot password?
                      </Link>
                    </FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account yet?{' '}
                <Link href={signUpHref} className="font-medium text-foreground underline underline-offset-4">
                  Sign up
                </Link>
              </p>
            </form>
          </Form>

          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </AuthMarketingBackdrop>
  );
}
