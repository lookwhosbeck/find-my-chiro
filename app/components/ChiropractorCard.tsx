import { Box, Flex, Text, Avatar } from '@radix-ui/themes';
import { Chiropractor } from '../lib/queries';

interface ChiropractorCardProps {
  chiropractor: Chiropractor;
}

export function ChiropractorCard({ chiropractor }: ChiropractorCardProps) {
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${chiropractor.firstName} ${chiropractor.lastName}`;
  
  // Build description from available data
  const descriptionParts: string[] = [];
  if (chiropractor.modality) descriptionParts.push(chiropractor.modality);
  if (chiropractor.philosophy) descriptionParts.push(chiropractor.philosophy);
  if (chiropractor.clinicName) descriptionParts.push(chiropractor.clinicName);
  if (chiropractor.city || chiropractor.state) {
    descriptionParts.push([chiropractor.city, chiropractor.state].filter(Boolean).join(', '));
  }
  const description = descriptionParts.join(', ');

  return (
    <Box
      className="chiropractor-card"
      style={{
        backgroundColor: 'var(--color-background)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* Top Section - Profile Image with Background */}
      <Box
        className="chiropractor-card-header"
        style={{
          height: '300px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0)',
        }}
      >
        {/* Background Gradient Overlay - matching hero gradient style */}
        <Box
          className="chiropractor-card-gradient"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, var(--color-bg-gradient-start) 0%, var(--color-bg-gradient-end) 50%, rgba(253, 233, 155, 0.6) 100%)',
            opacity: 0.7,
          }}
        />
        
        {/* Additional overlay layer for depth */}
        <Box
          style={{
            position: 'absolute',
            inset: '5% 0 0 0',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%)',
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />
        
        {/* Avatar */}
        <Box style={{ position: 'relative', zIndex: 1 }}>
          {chiropractor.avatarUrl ? (
            <Avatar 
              size="9" 
              radius="full" 
              src={chiropractor.avatarUrl} 
              fallback={initials}
              style={{
                width: '140px',
                height: '140px',
                border: '4px solid rgba(255, 255, 255, 0.9)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          ) : (
            <Avatar 
              size="9" 
              radius="full" 
              fallback={initials}
              style={{
                width: '140px',
                height: '140px',
                border: '4px solid rgba(255, 255, 255, 0.9)',
                backgroundColor: 'var(--color-yellow-accent)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Bottom Section - Text Content */}
      <Flex
        direction="column"
        gap="6"
        style={{
          padding: 'var(--space-5) var(--space-4)',
          alignItems: 'center',
          textAlign: 'center',
          backgroundColor: 'var(--color-background)',
        }}
      >
        {/* Name and Title */}
        <Flex direction="column" gap="0" align="center">
          <Text
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              fontWeight: 500,
              lineHeight: 'var(--leading-normal)',
              letterSpacing: 'var(--tracking-normal)',
              color: 'var(--color-text-primary)',
              textTransform: 'uppercase',
              marginBottom: '0',
            }}
          >
            {fullName.toUpperCase()}
          </Text>
          {chiropractor.clinicName && (
            <Text
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                lineHeight: 'var(--leading-normal)',
                letterSpacing: 'var(--tracking-normal)',
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                marginTop: 'var(--space-1)',
              }}
            >
              {chiropractor.clinicName.toUpperCase()}
            </Text>
          )}
        </Flex>

        {/* Description/Tagline */}
        {description && (
          <Text
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontStyle: 'italic',
              lineHeight: 'var(--leading-snug)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--color-text-primary)',
              marginTop: '0',
            }}
          >
            {description}
          </Text>
        )}

        {/* Additional Info - Only show if not already in description */}
        {(chiropractor.matchScore !== undefined || 
          (chiropractor.modality && !descriptionParts.includes(chiropractor.modality)) ||
          (chiropractor.philosophy && !descriptionParts.includes(chiropractor.philosophy))) && (
          <Flex direction="column" gap="2" style={{ width: '100%', marginTop: 'var(--space-1)' }}>
            {chiropractor.matchScore !== undefined && (
              <Text
                size="2"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                Match: {Math.round(chiropractor.matchScore)}%
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

