import { redirect } from 'next/navigation';

import { previewSectionHref } from './preview-routes';

export default function DashboardPreviewIndex() {
  redirect(previewSectionHref('profile'));
}
