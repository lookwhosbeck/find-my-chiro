'use client';

import { useState } from 'react';
import { Flex, Text, Button, TextField } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SearchSection() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');

  const handleSimpleSearch = () => {
    if (zipCode) {
      router.push(`/search?zip=${zipCode}`);
    }
  };

  return (
    <Flex direction="column" gap="5" align="center" style={{ width: '100%', maxWidth: '666px' }}>
      <Flex gap="3" align="center" style={{ width: '100%', fontSize: '0px' }}>
        <Flex align="center" style={{ flex: 1 }}>
          <TextField.Root
            size="3"
            placeholder="Search by Zipcode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSimpleSearch();
              }
            }}
            className="search-input-left"
            style={{
              flex: 1,
              border: '1px solid var(--color-text-primary)',
              boxShadow: 'var(--shadow-card)',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'var(--blur-sm)',
              minHeight: 'var(--touch-target-min)',
            }}
          />
          <Button
            size="3"
            variant="solid"
            onClick={handleSimpleSearch}
            className="search-button-right"
            style={{
              background: 'var(--color-text-primary)',
              color: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              border: 'none',
              padding: 'var(--space-3) var(--space-6)',
              minHeight: 'var(--touch-target-min)',
              borderRadius: '0px 6px 6px 0px',
            }}
          >
            Find Care
          </Button>
        </Flex>
        <Button
          size="3"
          variant="solid"
          asChild
        >
          <Link
            href="/search"
            style={{
              background: 'var(--color-text-primary)',
              color: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              border: 'none',
              padding: 'var(--space-3) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              textDecoration: 'none',
              minHeight: 'var(--touch-target-min)',
            }}
          >
            Advanced Search
          </Link>
        </Button>
      </Flex>
      <Text size="3" align="center" style={{ maxWidth: '640px', color: 'var(--color-text-primary)' }}>
        Use the advanced search to go beyond zip code and find a care provider who aligns with you on on a personal level that will help you reach your movement goals.
      </Text>
      <Flex gap="5" align="center">
        <Link
          href="/signup-patient"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
            fontSize: 'var(--text-base)',
          }}
        >
          Patient Signup
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <Link
          href="/signup"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
            fontSize: 'var(--text-base)',
          }}
        >
          Chiropractor Signup
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </Flex>
    </Flex>
  );
}