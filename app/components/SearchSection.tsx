'use client';

import { useState } from 'react';
import { Flex, Text, Button, TextField, Tabs } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

export function SearchSection() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');

  const handleSimpleSearch = () => {
    if (zipCode) {
      router.push(`/search?zip=${zipCode}`);
    }
  };

  const handleAdvancedSearch = () => {
    router.push('/search');
  };

  return (
    <Tabs.Root defaultValue="simple" style={{ width: '100%', maxWidth: '600px' }}>
      <Tabs.List style={{ justifyContent: 'center' }}>
        <Tabs.Trigger value="simple">Quick Search</Tabs.Trigger>
        <Tabs.Trigger value="advanced">Advanced Search</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="simple">
        <Flex gap="3" width="100%" style={{ maxWidth: '600px' }}>
          <TextField.Root
            size="3"
            placeholder="Enter zip code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            style={{ flex: 1 }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Button size="3" variant="solid" onClick={handleSimpleSearch}>Find Care</Button>
        </Flex>
      </Tabs.Content>

      <Tabs.Content value="advanced">
        <Flex direction="column" gap="3" align="center">
          <Text size="2" color="gray">
            Use detailed filters to find chiropractors who match your preferences perfectly.
          </Text>
          <Button size="3" variant="solid" onClick={handleAdvancedSearch}>
            Start Advanced Search
          </Button>
        </Flex>
      </Tabs.Content>
    </Tabs.Root>
  );
}