import { redirect } from 'next/navigation';

import { accountSettingsHref } from '@/lib/movyn-account-routes';

/**
 * `/account` is a thin redirect into the settings shell. Auth is enforced by
 * `middleware.ts`; the dashboard client (see `account-dashboard-client.tsx`)
 * handles the chiropractor "pending verification → getting started" hop after
 * mount, so we don't need a second server-side `getUser` + DB round trip here.
 */
export default function AccountIndexPage() {
  redirect(accountSettingsHref('profile'));
}
