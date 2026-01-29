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
        padding: 'var(--space-2)',
        minHeight: '214px',
      }}
    >
      <Flex direction="column" gap="2" align="center" style={{ flex: 1, paddingBottom: 'var(--space-4)' }}>
        <Text
          size="4"
          weight="medium"
          style={{
            fontSize: 'var(--text-lg)',
            lineHeight: 'var(--leading-normal)',
            letterSpacing: 'var(--tracking-normal)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          size="3"
          style={{
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-normal)',
            letterSpacing: 'var(--tracking-normal)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}
