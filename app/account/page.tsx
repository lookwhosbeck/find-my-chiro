import { redirect } from 'next/navigation';

import { accountSettingsHref, type AccountSettingsSlug } from '@/lib/movyn-account-routes';

/**
 * `/account` is a thin redirect into the settings shell. Auth is enforced by
 * `middleware.ts`; the dashboard client (see `account-dashboard-client.tsx`)
 * handles the chiropractor "pending verification → getting started" hop after
 * mount, so we don't need a second server-side `getUser` + DB round trip here.
 *
 * Preserves query params so Stripe checkout return URLs are not lost on redirect.
 */
export default function AccountIndexPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const hasCheckoutReturn =
    searchParams.checkout != null ||
    typeof searchParams.session_id === 'string' ||
    typeof searchParams.checkout_session_id === 'string';

  const slug: AccountSettingsSlug = hasCheckoutReturn ? 'membership' : 'profile';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  }
  const query = qs.toString();
  const destination = query ? `${accountSettingsHref(slug)}?${query}` : accountSettingsHref(slug);
  redirect(destination);
}
