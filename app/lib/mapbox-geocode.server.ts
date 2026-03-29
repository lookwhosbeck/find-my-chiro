import 'server-only';

export interface MapboxGeocodeResult {
  latitude: number;
  longitude: number;
}

function getMapboxToken(): string | null {
  const secret = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (secret) return secret;
  const pub = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  return pub || null;
}

function buildUsAddressQuery(parts: {
  address_line_1: string | null;
  address_line_2?: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}): string | null {
  const line1 = parts.address_line_1?.trim();
  const line2 = parts.address_line_2?.trim();
  const city = parts.city?.trim();
  const state = parts.state?.trim();
  const zip = parts.zip_code?.trim();
  const hasCore = Boolean(line1 || city || zip);
  if (!hasCore) return null;
  const segments = [line1, line2, [city, state].filter(Boolean).join(', ').trim(), zip].filter(
    (s) => s && String(s).length > 0,
  ) as string[];
  const q = segments.join(', ');
  return q.length > 0 ? q : null;
}

/**
 * Forward-geocode a US mailing address via Mapbox Geocoding API.
 * Uses MAPBOX_ACCESS_TOKEN, or falls back to NEXT_PUBLIC_MAPBOX_TOKEN.
 */
export async function mapboxForwardGeocodeUs(parts: {
  address_line_1: string | null;
  address_line_2?: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}): Promise<MapboxGeocodeResult | null> {
  const token = getMapboxToken();
  if (!token) {
    return null;
  }

  const query = buildUsAddressQuery(parts);
  if (!query) {
    return null;
  }

  const encoded = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=US&limit=1&types=address,place,postcode&access_token=${token}`;

  const res = await fetch(url, { method: 'GET', next: { revalidate: 0 } });
  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as {
    features?: { center?: [number, number] }[];
  };

  const center = json.features?.[0]?.center;
  if (!center || center.length < 2) {
    return null;
  }

  const [longitude, latitude] = center;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}
