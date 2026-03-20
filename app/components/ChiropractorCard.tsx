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

export function ChiropractorCard({ chiropractor }: ChiropractorCardProps) {
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const displayName = `Dr. ${chiropractor.firstName} ${chiropractor.lastName}`.trim();
  const specialtyLine = buildSpecialtyLine(chiropractor);
  const locationLine = [chiropractor.city, chiropractor.state].filter(Boolean).join(', ');
  const distanceSuffix =
    chiropractor.distanceMiles != null && Number.isFinite(chiropractor.distanceMiles)
      ? ` · ${chiropractor.distanceMiles.toFixed(1)} mi`
      : '';
  const showMatch =
    chiropractor.matchScore !== undefined && chiropractor.matchScore > 0;

  return (
    <Box
      className="chiropractor-card"
      style={{
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        padding: 'var(--profile-card-padding)',
        width: '100%',
      }}
    >
      <Flex direction="column" gap="4" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Flex align="start" justify="between" style={{ width: '100%', minHeight: 80 }}>
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
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
                    fontSize: 28,
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
                padding: 4,
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  color: 'var(--color-match-badge-text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: '-0.36px',
                  lineHeight: '24px',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(chiropractor.matchScore!)}% Match
              </Text>
            </Box>
          )}
        </Flex>

        <Flex direction="column" gap="1" align="start" style={{ width: '100%' }}>
          <Text
            as="p"
            style={{
              color: 'var(--color-chiro-card-text)',
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '0.16px',
              lineHeight: '24px',
              margin: 0,
              width: '100%',
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
                fontSize: 16,
                fontWeight: 400,
                letterSpacing: '-0.32px',
                lineHeight: '22.4px',
                margin: 0,
                width: '100%',
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
            gap: 10,
            paddingTop: 'var(--space-4)',
          }}
        >
          <LocationPinIcon
            style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}
          />
          <Text
            as="p"
            style={{
              color: 'var(--color-chiro-card-text)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: '-0.32px',
              lineHeight: '22.4px',
              margin: 0,
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
