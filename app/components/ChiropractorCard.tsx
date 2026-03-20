import type { CSSProperties } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
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

export function ChiropractorCard({ chiropractor, marketingMatchPercent, variant = 'default' }: ChiropractorCardProps) {
  const isMarquee = variant === 'marquee';
  const avatarSize = isMarquee ? 56 : 80;
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

  const specialtyClampStyle = isMarquee
    ? ({
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical' as const,
        WebkitLineClamp: 2,
        overflow: 'hidden',
      } satisfies CSSProperties)
    : undefined;

  return (
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
      <Flex direction="column" gap={isMarquee ? '2' : '4'} style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Flex align="start" justify="between" style={{ width: '100%', minHeight: avatarSize }}>
          <Box
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: isMarquee ? 10 : 12,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: 'var(--color-yellow-accent)',
            }}
          >
            {chiropractor.avatarUrl ? (
              <img
                src={chiropractor.avatarUrl}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Flex
                align="center"
                justify="center"
                style={{ width: '100%', height: '100%' }}
              >
                <Text
                  weight="medium"
                  style={{
                    color: 'var(--color-chiro-card-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: isMarquee ? 18 : 28,
                    lineHeight: 1,
                  }}
                >
                  {initials}
                </Text>
              </Flex>
            )}
          </Box>
          {showMatch && (
            <Box
              style={{
                backgroundColor: 'var(--color-match-badge-bg)',
                borderRadius: 5,
                padding: isMarquee ? 3 : 4,
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  color: 'var(--color-match-badge-text)',
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
          )}
        </Flex>

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
      </Flex>

      {locationLine || distanceSuffix ? (
        <Flex
          align="center"
          style={{
            flexShrink: 0,
            gap: isMarquee ? 6 : 10,
            paddingTop: isMarquee ? 8 : 'var(--space-4)',
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
      ) : null}
    </Box>
  );
}
