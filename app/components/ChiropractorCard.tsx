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
      style={{
        borderRadius: '24px',
        backgroundColor: '#fcf9f7',
        boxShadow: '0px 50px 40px 0px rgba(0,0,0,0.01), 0px 50px 40px 0px rgba(0,0,0,0.02), 0px 20px 40px 0px rgba(0,0,0,0.05), 0px 3px 10px 0px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* Top Section - Profile Image with Background */}
      <Box
        style={{
          height: '300px',
          position: 'relative',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0)',
        }}
      >
        {/* Background Gradient Overlay - matching hero gradient style */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #9ed4ef 0%, #e0f0f5 50%, rgba(253, 233, 155, 0.6) 100%)',
            borderRadius: '24px 24px 0 0',
            opacity: 0.7,
          }}
        />
        
        {/* Additional overlay layer for depth */}
        <Box
          style={{
            position: 'absolute',
            inset: '5% 0 0 0',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%)',
            borderRadius: '24px 24px 0 0',
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
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
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
                backgroundColor: '#fde99b',
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
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
          padding: '24px 20px',
          alignItems: 'center',
          textAlign: 'center',
          backgroundColor: '#fcf9f7',
        }}
      >
        {/* Name and Title */}
        <Flex direction="column" gap="0" align="center">
          <Text
            style={{
              fontFamily: "'Untitled Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '22.4px',
              letterSpacing: '-0.32px',
              color: '#030302',
              textTransform: 'uppercase',
              marginBottom: '0',
            }}
          >
            {fullName.toUpperCase()}
          </Text>
          {chiropractor.clinicName && (
            <Text
              style={{
                fontFamily: "'Untitled Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '22.4px',
                letterSpacing: '-0.32px',
                color: '#030302',
                textTransform: 'uppercase',
                marginTop: '2px',
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
              fontFamily: "'Untitled Serif', Georgia, serif",
              fontSize: '24px',
              fontStyle: 'italic',
              lineHeight: '28.8px',
              letterSpacing: '-0.72px',
              color: '#030302',
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
          <Flex direction="column" gap="2" style={{ width: '100%', marginTop: '4px' }}>
            {chiropractor.matchScore !== undefined && (
              <Text
                size="2"
                style={{
                  fontFamily: "'Untitled Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: 500,
                  color: '#030302',
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

