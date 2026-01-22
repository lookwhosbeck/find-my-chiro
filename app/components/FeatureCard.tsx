import { Flex, Text } from '@radix-ui/themes';

interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Flex
      direction="column"
      gap="8"
      align="center"
      style={{
        flex: 1,
        padding: '8px',
        minHeight: '214px',
      }}
    >
      <Flex direction="column" gap="2" align="center" style={{ flex: 1, paddingBottom: '16px' }}>
        <Text
          size="4"
          weight="medium"
          style={{
            fontSize: '18px',
            lineHeight: '25.2px',
            letterSpacing: '-0.36px',
            color: '#030302',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          size="3"
          style={{
            fontSize: '16px',
            lineHeight: '22.4px',
            letterSpacing: '-0.32px',
            color: '#030302',
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}
