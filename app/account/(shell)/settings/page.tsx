import { redirect } from 'next/navigation';

import { accountSettingsHref } from '@/lib/movyn-account-routes';

export default function AccountSettingsIndexPage() {
  redirect(accountSettingsHref('profile'));
}
