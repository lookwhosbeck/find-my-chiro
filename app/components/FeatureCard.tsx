import type { ReactNode } from 'react';
import { Flex, Text } from '@radix-ui/themes';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Flex
      direction="column"
      gap="3"
      align="center"
      style={{
        flex: '0 1 262px',
        maxWidth: 262,
        padding: 'var(--space-2)',
      }}
    >
      {icon ? <Flex justify="center">{icon}</Flex> : null}
      <Text
        as="p"
        style={{
          fontSize: 13,
          fontWeight: 700,
          lineHeight: '20px',
          color: '#030302',
          textAlign: 'center',
          margin: 0,
          fontFamily: 'var(--font-body)',
        }}
      >
        {title}
      </Text>
      <Text
        as="p"
        style={{
          fontSize: 13,
          fontWeight: 400,
          lineHeight: '20px',
          color: '#030302',
          textAlign: 'center',
          margin: 0,
          fontFamily: 'var(--font-body)',
        }}
      >
        {description}
      </Text>
    </Flex>
  );
}
