import { notFound } from 'next/navigation';

import { navKeyFromSettingsSlug } from '@/lib/movyn-account-routes';

import { DashboardPreviewShell } from '../preview-shell';

export default function DashboardPreviewSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const navKey = navKeyFromSettingsSlug(params.section);
  if (!navKey) notFound();
  return <DashboardPreviewShell activeNav={navKey} />;
}
