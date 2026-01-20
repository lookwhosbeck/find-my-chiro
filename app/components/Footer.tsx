import { Flex, Text } from '@radix-ui/themes';

export function Footer() {
  return (
    <Flex
      as="footer"
      align="center"
      justify="center"
      p="6"
      style={{
        borderTop: '1px solid var(--gray-4)',
        background: 'var(--gray-1)',
      }}
    >
      <Text size="2" color="gray">
        © 2026 Find My Chiro Directory. All rights reserved.
      </Text>
    </Flex>
  );
}




