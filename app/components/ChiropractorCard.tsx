import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Box, Flex, Text } from '@radix-ui/themes';
import { matchScorePillColors } from '../lib/match-score-pill-colors';
import { Chiropractor } from '../lib/queries';

function LocationPinIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg
      width={12}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={style}
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ChiropractorCardProps {
  chiropractor: Chiropractor;
  /** Link target (e.g. include search query params for match chart on profile). Defaults to `/chiropractor/[id]`. */
  profileHref?: string;
  /** Homepage / marketing carousel: show a static match % when no search match exists */
  marketingMatchPercent?: number;
  /** Compact square layout for homepage marquee */
  variant?: 'default' | 'marquee';
}

function buildSpecialtyLine(chiropractor: Chiropractor): string {
  const parts: string[] = [];
  if (chiropractor.modality) {
    parts.push(chiropractor.modality);
  } else if (chiropractor.modalities?.length) {
    parts.push(chiropractor.modalities.slice(0, 2).join(', '));
  }
  if (chiropractor.philosophy) {
    parts.push(chiropractor.philosophy);
  }
  if (parts.length > 0) {
    return parts.join(', ');
  }
  if (chiropractor.clinicName) {
    return chiropractor.clinicName;
  }
  return '';
}

export function ChiropractorCard({
  chiropractor,
  profileHref,
  marketingMatchPercent,
  variant = 'default',
}: ChiropractorCardProps) {
  const isMarquee = variant === 'marquee';
  const avatarSize = isMarquee ? 72 : 80;
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const displayName = `Dr. ${chiropractor.firstName} ${chiropractor.lastName}`.trim();
  const specialtyLine = buildSpecialtyLine(chiropractor);
  const locationLine = [chiropractor.city, chiropractor.state].filter(Boolean).join(', ');
  const distanceSuffix =
    chiropractor.distanceMiles != null && Number.isFinite(chiropractor.distanceMiles)
      ? ` · ${chiropractor.distanceMiles.toFixed(1)} mi`
      : '';
  const matchPercent =
    marketingMatchPercent ??
    (chiropractor.matchScore !== undefined && chiropractor.matchScore > 0
      ? Math.round(chiropractor.matchScore)
      : null);
  const showMatch = matchPercent != null;
  const matchPillColors = showMatch ? matchScorePillColors(matchPercent) : null;

  const specialtyClampStyle = isMarquee
    ? ({
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical' as const,
        WebkitLineClamp: 2,
        overflow: 'hidden',
      } satisfies CSSProperties)
    : undefined;

  const avatarBlock = (
    <Box
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: 12,
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: isMarquee ? '#030302' : 'var(--color-yellow-accent)',
      }}
    >
      {chiropractor.avatarUrl ? (
        <img
          src={chiropractor.avatarUrl}
          alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
          <Text
            weight="medium"
            style={{
              color: isMarquee ? '#ffffff' : 'var(--color-chiro-card-text)',
              fontFamily: 'var(--font-body)',
              fontSize: isMarquee ? 22 : 28,
              lineHeight: 1,
            }}
          >
            {initials}
          </Text>
        </Flex>
      )}
    </Box>
  );

  const matchBadge = showMatch && matchPillColors ? (
    <Box
      style={{
        ...matchPillColors,
        borderRadius: 5,
        padding: isMarquee ? 3 : 4,
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          color: matchPillColors.color,
          fontFamily: 'var(--font-body)',
          fontSize: isMarquee ? 11 : 12,
          fontWeight: 400,
          letterSpacing: '-0.36px',
          lineHeight: isMarquee ? '18px' : '24px',
          whiteSpace: 'nowrap',
        }}
      >
        {matchPercent}% Match
      </Text>
    </Box>
  ) : null;

  const nameAndSpecialty = (
    <Flex direction="column" gap="1" align="start" style={{ width: '100%', minWidth: 0 }}>
      <Text
        as="p"
        style={{
          color: 'var(--color-chiro-card-text)',
          fontFamily: 'var(--font-body)',
          fontSize: isMarquee ? 14 : 16,
          fontWeight: 500,
          letterSpacing: '0.16px',
          lineHeight: isMarquee ? '20px' : '24px',
          margin: 0,
          width: '100%',
          ...(isMarquee
            ? {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }
            : {}),
        }}
      >
        {displayName}
      </Text>
      {specialtyLine ? (
        <Text
          as="p"
          style={{
            color: 'var(--color-chiro-card-text)',
            fontFamily: 'var(--font-body)',
            fontSize: isMarquee ? 13 : 16,
            fontWeight: 400,
            letterSpacing: '-0.32px',
            lineHeight: isMarquee ? '18px' : '22.4px',
            margin: 0,
            width: '100%',
            ...specialtyClampStyle,
          }}
        >
          {specialtyLine}
        </Text>
      ) : null}
    </Flex>
  );

  const locationRow =
    locationLine || distanceSuffix ? (
      <Flex
        align="center"
        style={{
          flexShrink: 0,
          gap: isMarquee ? 6 : 10,
          paddingTop: isMarquee ? 6 : 'var(--space-4)',
          minWidth: 0,
        }}
      >
        <LocationPinIcon
          style={{
            flexShrink: 0,
            color: 'var(--color-text-secondary)',
            width: isMarquee ? 10 : 12,
            height: isMarquee ? 13 : 16,
          }}
        />
        <Text
          as="p"
          style={{
            color: 'var(--color-chiro-card-text)',
            fontFamily: 'var(--font-body)',
            fontSize: isMarquee ? 12 : 14,
            fontWeight: 400,
            letterSpacing: '-0.32px',
            lineHeight: isMarquee ? '16px' : '22.4px',
            margin: 0,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {locationLine}
          {distanceSuffix}
        </Text>
      </Flex>
    ) : null;

  const href = profileHref ?? `/chiropractor/${chiropractor.id}`;

  const cardInner = (
    <Box
      className="chiropractor-card"
      data-variant={isMarquee ? 'marquee' : undefined}
      style={{
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        padding: isMarquee ? 14 : 'var(--profile-card-padding)',
        width: '100%',
      }}
    >
      {isMarquee ? (
        <Flex
          direction="column"
          justify="between"
          gap="0"
          style={{ flex: '1 1 auto', minHeight: 0, width: '100%' }}
        >
          <Flex align="start" justify="between" style={{ width: '100%', flexShrink: 0, minHeight: avatarSize }}>
            {avatarBlock}
            {matchBadge}
          </Flex>
          <Flex direction="column" gap="0" align="start" style={{ width: '100%', minWidth: 0, flexShrink: 0 }}>
            {nameAndSpecialty}
            {locationRow}
          </Flex>
        </Flex>
      ) : (
        <>
          <Flex direction="column" gap="4" style={{ flex: '1 1 auto', minHeight: 0 }}>
            <Flex align="start" justify="between" style={{ width: '100%', minHeight: avatarSize }}>
              {avatarBlock}
              {matchBadge}
            </Flex>
            {nameAndSpecialty}
          </Flex>
          {locationRow}
        </>
      )}
    </Box>
  );

  return (
    <Link
      href={href}
      className="chiropractor-card-link"
      prefetch={false}
      aria-label={`View profile: ${displayName}`}
    >
      {cardInner}
    </Link>
  );
}
