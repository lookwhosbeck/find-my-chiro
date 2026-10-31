import { NextResponse } from 'next/server';
import { getCachedFoundingAvailability } from '@/app/lib/founding-availability.server';

export const dynamic = 'force-dynamic';

/** Whether the first-1,000 founding checkout is still open. Does not expose the promotion code id. */
export async function GET() {
  const availability = await getCachedFoundingAvailability();
  return NextResponse.json(availability);
}
