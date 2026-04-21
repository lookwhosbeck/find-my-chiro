'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Served from `/public/images` so it ships with the app and works on Vercel. */
export const AUTH_MARKETING_BACKGROUND_IMAGE = '/images/login-screen-office-image.jpg';

type AuthMarketingBackdropProps = {
  children: ReactNode;
  className?: string;
};

export function AuthMarketingBackdrop({ children, className }: AuthMarketingBackdropProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10',
        className,
      )}
      style={{ backgroundImage: `url('${AUTH_MARKETING_BACKGROUND_IMAGE}')` }}
    >
      {children}
    </div>
  );
}
