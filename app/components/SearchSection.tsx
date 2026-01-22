'use client';

import { useState } from 'react';
import { Flex, Text, Button, TextField } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Custom slider icon SVG component
const SliderIcon = ({ width = 16, height = 16 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/>
    <circle cx="5" cy="8" r="2" fill="currentColor"/>
    <circle cx="11" cy="8" r="2" fill="currentColor"/>
  </svg>
);

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
      <Flex gap="3" align="center" style={{ width: '100%' }}>
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
          style={{
            flex: 1,
            borderRadius: '9999px 0 0 9999px',
            border: '1px solid #030302',
            boxShadow: '0px 12px 12px 2px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
        <Button
          size="3"
          variant="solid"
          onClick={handleSimpleSearch}
          style={{
            borderRadius: '0 9999px 9999px 0',
            background: '#030302',
            color: 'white',
            boxShadow: '0px 12px 12px 2px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)',
            border: 'none',
            padding: '12px 32px',
          }}
        >
          Find Care
        </Button>
        <Button
          size="3"
          variant="solid"
          asChild
        >
          <Link
            href="/search"
            style={{
              borderRadius: '9999px',
              background: '#030302',
              color: 'white',
              boxShadow: '0px 12px 12px 2px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)',
              border: 'none',
              padding: '12px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <SliderIcon width={16} height={16} />
            Advanced Search
          </Link>
        </Button>
      </Flex>
      <Text size="3" align="center" style={{ maxWidth: '640px', color: '#030302' }}>
        Use the advanced search to go beyond zip code and find a care provider who aligns with you on on a personal level that will help you reach your movement goals.
      </Text>
      <Flex gap="5" align="center">
        <Link
          href="/signup-patient"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#030302',
            textDecoration: 'none',
            fontSize: '16px',
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
            gap: '8px',
            color: '#030302',
            textDecoration: 'none',
            fontSize: '16px',
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