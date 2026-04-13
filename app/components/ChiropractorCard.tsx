import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Box, Flex, Text } from '@radix-ui/themes';
import { buildChiropractorSpecialtyLine } from '../lib/chiropractor-specialty-line';
import { matchScorePillColors } from '../lib/match-score-pill-colors';
import { Chiropractor } from '../lib/queries';
import { ChiropractorMapCard } from './ChiropractorMapCard';

function LocationPinIcon({ style, className }: { style?: CSSProperties; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      style={{
        display: 'block',
        flexShrink: 0,
        ...(className ? {} : { width: 12, height: 16 }),
        ...style,
      }}
    >
      <path
        d="M0.00312419 5.85942C0.00312419 2.62214 2.68992 0 6.00156 0C9.3132 0 12 2.62214 12 5.85942C12 9.56583 8.24473 14.0085 6.67639 15.7017C6.30773 16.0994 5.69227 16.0994 5.32361 15.7017C3.75527 14.0085 0 9.56583 0 5.85942H0.00312419ZM6.00156 7.9534C6.53186 7.9534 7.04043 7.74391 7.41541 7.37102C7.79038 6.99814 8.00104 6.49239 8.00104 5.96505C8.00104 5.43771 7.79038 4.93196 7.41541 4.55907C7.04043 4.18619 6.53186 3.9767 6.00156 3.9767C5.47127 3.9767 4.96269 4.18619 4.58772 4.55907C4.21274 4.93196 4.00208 5.43771 4.00208 5.96505C4.00208 6.49239 4.21274 6.99814 4.58772 7.37102C4.96269 7.74391 5.47127 7.9534 6.00156 7.9534Z"
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
  /** `marquee`: homepage carousel. `map`: map list / horizontal snap (search). */
  variant?: 'default' | 'marquee' | 'map';
  showReferralIcon?: boolean;
  onReferPatient?: () => void;
}

export function ChiropractorCard({
  chiropractor,
  profileHref,
  marketingMatchPercent,
  variant = 'default',
  showReferralIcon,
  onReferPatient,
}: ChiropractorCardProps) {
  if (variant === 'map') {
    return (
      <ChiropractorMapCard
        chiropractor={chiropractor}
        profileHref={profileHref}
        showReferralIcon={showReferralIcon}
        onReferPatient={onReferPatient}
      />
    );
  }

  const isMarquee = variant === 'marquee';
  const avatarSize = isMarquee ? 72 : 80;
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const displayName = `Dr. ${chiropractor.firstName} ${chiropractor.lastName}`.trim();
  const specialtyLine = buildChiropractorSpecialtyLine(chiropractor);
  const locationLine = [chiropractor.city, chiropractor.state].filter(Boolean).join(', ');
  const distanceMiles =
    chiropractor.distanceMiles != null && Number.isFinite(chiropractor.distanceMiles)
      ? chiropractor.distanceMiles
      : null;
  const distanceSuffix = distanceMiles != null ? ` · ${distanceMiles.toFixed(1)} mi` : '';
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
