import { Card, Flex, Text, Avatar, Badge } from '@radix-ui/themes';
import { Chiropractor } from '../lib/queries';

interface ChiropractorCardProps {
  chiropractor: Chiropractor;
}

export function ChiropractorCard({ chiropractor }: ChiropractorCardProps) {
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `Dr. ${chiropractor.firstName} ${chiropractor.lastName}`;

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex gap="3" align="center">
          {chiropractor.avatarUrl ? (
            <Avatar size="4" radius="full" src={chiropractor.avatarUrl} fallback={initials} />
          ) : (
            <Avatar size="4" radius="full" fallback={initials} />
          )}
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text weight="bold">{fullName}</Text>
            {chiropractor.acceptingPatients !== false && (
              <Badge color="green" size="1">Accepting Patients</Badge>
            )}
          </Flex>
        </Flex>
        <Flex direction="column" gap="2">
          {chiropractor.philosophy && (
            <Flex gap="2">
              <Text size="2" color="gray">Philosophy:</Text>
              <Text size="2" weight="medium">{chiropractor.philosophy}</Text>
            </Flex>
          )}
          {chiropractor.modality && (
            <Flex gap="2">
              <Text size="2" color="gray">Modality:</Text>
              <Text size="2" weight="medium">{chiropractor.modality}</Text>
            </Flex>
          )}
          {chiropractor.clinicName && (
            <Flex gap="2">
              <Text size="2" color="gray">Clinic:</Text>
              <Text size="2" weight="medium">{chiropractor.clinicName}</Text>
            </Flex>
          )}
          {(chiropractor.city || chiropractor.state) && (
            <Flex gap="2">
              <Text size="2" color="gray">Location:</Text>
              <Text size="2" weight="medium">
                {[chiropractor.city, chiropractor.state].filter(Boolean).join(', ')}
              </Text>
            </Flex>
          )}
          {chiropractor.matchScore !== undefined && (
            <Flex gap="2">
              <Text size="2" color="gray">Match:</Text>
              <Text size="2" weight="medium" style={{ color: 'var(--green-11)' }}>
                {Math.round(chiropractor.matchScore)}%
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

