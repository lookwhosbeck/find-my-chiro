import { getCachedHomeMapChiropractors } from '@/app/lib/home-chiropractors.server';

import { HomeMapPreviewDynamic } from './home-map-preview-dynamic';

/** Async RSC: map data loads after shell; mapbox-gl loads only in the client dynamic chunk. */
export async function HomeMapPreviewLoader() {
  const mapChiropractors = await getCachedHomeMapChiropractors();
  return <HomeMapPreviewDynamic chiropractors={mapChiropractors} />;
}
